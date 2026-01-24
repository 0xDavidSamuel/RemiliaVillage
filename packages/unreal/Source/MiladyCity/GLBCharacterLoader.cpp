// GLBCharacterLoader.cpp

#include "GLBCharacterLoader.h"
#include "GLBCharacter.h"
#include "HttpModule.h"
#include "glTFRuntimeFunctionLibrary.h"
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

    // Spawn GLBCharacter (possessable character with movement)
    FActorSpawnParameters SpawnParams;
    SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;

    AGLBCharacter* SpawnedCharacter = GetWorld()->SpawnActor<AGLBCharacter>(
        AGLBCharacter::StaticClass(), 
        PendingSpawnLocation, 
        PendingSpawnRotation, 
        SpawnParams
    );
    
    if (!SpawnedCharacter)
    {
        UE_LOG(LogTemp, Error, TEXT("[GLBLoader] Failed to spawn GLBCharacter"));
        OnCharacterLoaded.Broadcast(nullptr);
        return;
    }

    // Load all skeletal meshes from GLB
    TArray<USkeletalMesh*> LoadedMeshes;
    FglTFRuntimeSkeletalMeshConfig SkeletalConfig;

    for (int32 NodeIndex = 0; NodeIndex < 20; NodeIndex++)
    {
        USkeletalMesh* SkeletalMesh = Asset->LoadSkeletalMesh(NodeIndex, -1, SkeletalConfig);
        if (SkeletalMesh)
        {
            LoadedMeshes.Add(SkeletalMesh);
            UE_LOG(LogTemp, Log, TEXT("[GLBLoader] Loaded skeletal mesh from node %d"), NodeIndex);
        }
    }

    UE_LOG(LogTemp, Log, TEXT("[GLBLoader] Total meshes loaded: %d"), LoadedMeshes.Num());

    // Attach meshes to character
    SpawnedCharacter->AttachGLBMeshes(LoadedMeshes);

    UE_LOG(LogTemp, Log, TEXT("[GLBLoader] Character spawned at %s"), *PendingSpawnLocation.ToString());
    OnCharacterLoaded.Broadcast(SpawnedCharacter);
}