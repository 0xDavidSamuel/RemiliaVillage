// GLBCharacterLoader.cpp

#include "GLBCharacterLoader.h"
#include "HttpModule.h"
#include "glTFRuntimeFunctionLibrary.h"
#include "GameFramework/Character.h"
#include "Components/SkeletalMeshComponent.h"

AGLBCharacterLoader::AGLBCharacterLoader()
{
    PrimaryActorTick.bCanEverTick = false;
}

void AGLBCharacterLoader::LoadCharacterFromURL(const FString& URL, FVector SpawnLocation, FRotator SpawnRotation)
{
    PendingSpawnLocation = SpawnLocation;
    PendingSpawnRotation = SpawnRotation;

    UE_LOG(LogTemp, Log, TEXT("[GLBLoader] Fetching GLB from: %s"), *URL);

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(URL);
    Request->SetVerb(TEXT("GET"));
    Request->OnProcessRequestComplete().BindUObject(this, &AGLBCharacterLoader::OnGLBDownloaded);
    Request->ProcessRequest();
}

void AGLBCharacterLoader::OnGLBDownloaded(TSharedPtr<IHttpRequest, ESPMode::ThreadSafe> Request, TSharedPtr<IHttpResponse, ESPMode::ThreadSafe> Response, bool bWasSuccessful)
{
    if (!bWasSuccessful || !Response.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("[GLBLoader] Failed to download GLB"));
        OnCharacterLoaded.Broadcast(nullptr);
        return;
    }

    if (Response->GetResponseCode() != 200)
    {
        UE_LOG(LogTemp, Error, TEXT("[GLBLoader] HTTP error: %d"), Response->GetResponseCode());
        OnCharacterLoaded.Broadcast(nullptr);
        return;
    }

    TArray<uint8> Data = Response->GetContent();
    UE_LOG(LogTemp, Log, TEXT("[GLBLoader] Downloaded %d bytes"), Data.Num());

    // Parse GLB data
    FglTFRuntimeConfig Config;
    UglTFRuntimeAsset* Asset = UglTFRuntimeFunctionLibrary::glTFLoadAssetFromData(Data, Config);

    if (!Asset)
    {
        UE_LOG(LogTemp, Error, TEXT("[GLBLoader] Failed to parse GLB data"));
        OnCharacterLoaded.Broadcast(nullptr);
        return;
    }

    UE_LOG(LogTemp, Log, TEXT("[GLBLoader] GLB parsed successfully"));

    // Spawn actor
    FActorSpawnParameters SpawnParams;
    SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;

    AActor* SpawnedActor = GetWorld()->SpawnActor<AActor>(AActor::StaticClass(), PendingSpawnLocation, PendingSpawnRotation, SpawnParams);
    
    if (!SpawnedActor)
    {
        UE_LOG(LogTemp, Error, TEXT("[GLBLoader] Failed to spawn actor"));
        OnCharacterLoaded.Broadcast(nullptr);
        return;
    }

    // Create a scene root
    USceneComponent* SceneRoot = NewObject<USceneComponent>(SpawnedActor);
    SpawnedActor->SetRootComponent(SceneRoot);
    SceneRoot->RegisterComponent();

    FglTFRuntimeSkeletalMeshConfig SkeletalConfig;
    int32 MeshCount = 0;
    USkeletalMeshComponent* PrimarySkeletalMeshComp = nullptr;

    // Try loading skeletal meshes by index (0 through 20 should cover most models)
    for (int32 NodeIndex = 0; NodeIndex < 20; NodeIndex++)
    {
        USkeletalMesh* SkeletalMesh = Asset->LoadSkeletalMesh(NodeIndex, -1, SkeletalConfig);
        
        if (SkeletalMesh)
        {
            USkeletalMeshComponent* SkeletalMeshComp = NewObject<USkeletalMeshComponent>(SpawnedActor);
            SkeletalMeshComp->SetupAttachment(SceneRoot);
            SkeletalMeshComp->RegisterComponent();
            SkeletalMeshComp->SetSkeletalMesh(SkeletalMesh);
            
            UE_LOG(LogTemp, Log, TEXT("[GLBLoader] Loaded skeletal mesh %d from node index %d"), MeshCount, NodeIndex);
            
            // Keep reference to first one for bone logging
            if (MeshCount == 0)
            {
                PrimarySkeletalMeshComp = SkeletalMeshComp;
            }
            
            MeshCount++;
        }
    }

    UE_LOG(LogTemp, Log, TEXT("[GLBLoader] Total skeletal meshes loaded: %d"), MeshCount);

    // Log bones from primary mesh
    if (PrimarySkeletalMeshComp && PrimarySkeletalMeshComp->GetSkeletalMeshAsset())
    {
        const FReferenceSkeleton& RefSkel = PrimarySkeletalMeshComp->GetSkeletalMeshAsset()->GetRefSkeleton();
        for (int32 i = 0; i < RefSkel.GetNum(); i++)
        {
            UE_LOG(LogTemp, Log, TEXT("[GLBLoader] Bone %d: %s"), i, *RefSkel.GetBoneName(i).ToString());
        }
    }

    // Fallback if no skeletal meshes found
    if (MeshCount == 0)
    {
        UE_LOG(LogTemp, Warning, TEXT("[GLBLoader] No skeletal meshes found, trying static mesh"));
        
        FglTFRuntimeStaticMeshConfig StaticConfig;
        UStaticMesh* StaticMesh = Asset->LoadStaticMesh(0, StaticConfig);
        
        if (StaticMesh)
        {
            UStaticMeshComponent* StaticMeshComp = NewObject<UStaticMeshComponent>(SpawnedActor);
            StaticMeshComp->SetupAttachment(SceneRoot);
            StaticMeshComp->RegisterComponent();
            StaticMeshComp->SetStaticMesh(StaticMesh);
            UE_LOG(LogTemp, Log, TEXT("[GLBLoader] Static mesh loaded and applied"));
        }
    }

    UE_LOG(LogTemp, Log, TEXT("[GLBLoader] Character spawned at %s"), *PendingSpawnLocation.ToString());
    OnCharacterLoaded.Broadcast(SpawnedActor);
}