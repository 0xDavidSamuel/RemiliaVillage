// Copyright Epic Games, Inc. All Rights Reserved.

#include "MiladyCityGameMode.h"
#include "WebService.h"
#include "AuthService.h"
#include "LoginWidget.h"
#include "GLBCharacterLoader.h"
#include "Engine/GameInstance.h"
#include "Kismet/GameplayStatics.h"

AMiladyCityGameMode::AMiladyCityGameMode()
{
}

void AMiladyCityGameMode::BeginPlay()
{
    Super::BeginPlay();

    // Spawn the character loader
    FActorSpawnParameters SpawnParams;
    CharacterLoader = GetWorld()->SpawnActor<AGLBCharacterLoader>(AGLBCharacterLoader::StaticClass(), SpawnParams);
    if (CharacterLoader)
    {
        CharacterLoader->OnCharacterLoaded.AddDynamic(this, &AMiladyCityGameMode::OnCharacterLoaded);
        UE_LOG(LogTemp, Log, TEXT("[MiladyCity] Character loader ready"));
    }

    UGameInstance* GI = GetGameInstance();
    if (GI)
    {
        UAuthService* Auth = GI->GetSubsystem<UAuthService>();
        if (Auth)
        {
            // Listen for auth result
            Auth->OnAuthComplete.AddDynamic(this, &AMiladyCityGameMode::OnAuthComplete);
            
            // Start login
            UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] Starting login..."));
            Auth->Login();
        }
    }
}

void AMiladyCityGameMode::OnAuthComplete(bool bSuccess, const FString& WalletAddress, const FPlayerData& PlayerData)
{
    if (bSuccess)
    {
        UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] LOGIN SUCCESS! Wallet: %s"), *WalletAddress);
        
        if (PlayerData.IsNFT())
        {
            UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] NFT Character - TokenId: %s"), *PlayerData.TokenId);
            // TODO: Fetch model URL from chain using TokenId
        }
        else if (PlayerData.IsValid())
        {
            UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] Demo Character - ID: %d, Name: %s"), PlayerData.PlayerId, *PlayerData.PlayerName);
            UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] Model URL: %s"), *PlayerData.ModelURL);
            
            // Build full URL and load character
            FString FullURL = BaseURL + PlayerData.ModelURL;
            UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] Loading character from: %s"), *FullURL);
            
            if (CharacterLoader)
            {
                // Spawn at player start location
                AActor* PlayerStart = FindPlayerStart(nullptr);
                FVector SpawnLocation = PlayerStart ? PlayerStart->GetActorLocation() : FVector(0, 0, 100);
                FRotator SpawnRotation = PlayerStart ? PlayerStart->GetActorRotation() : FRotator::ZeroRotator;
                
                CharacterLoader->LoadCharacterFromURL(FullURL, SpawnLocation, SpawnRotation);
            }
        }
        else
        {
            UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] No character selected - using default"));
        }
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("[MiladyCity] LOGIN FAILED"));
    }
}

void AMiladyCityGameMode::OnCharacterLoaded(AActor* SpawnedCharacter)
{
    if (SpawnedCharacter)
    {
        UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] Character loaded and spawned!"));
        
        // Move it in front of camera so we can see it
        APlayerController* PC = GetWorld()->GetFirstPlayerController();
        if (PC)
        {
            FVector CamLoc;
            FRotator CamRot;
            PC->GetPlayerViewPoint(CamLoc, CamRot);
            
            // Place 500 units in front of camera
            FVector SpawnLoc = CamLoc + CamRot.Vector() * 500.0f;
            SpawnLoc.Z = 0; // Ground level
            
            SpawnedCharacter->SetActorLocation(SpawnLoc);
            SpawnedCharacter->SetActorRotation(FRotator(0, CamRot.Yaw + 180, 0)); // Face camera
        }
        
        // Scale to reasonable size (adjust if needed)
        SpawnedCharacter->SetActorScale3D(FVector(1.0f, 1.0f, 1.0f));
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("[MiladyCity] Failed to load character"));
    }
}