// MiladyCityGameMode.cpp

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

    UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] ========== GAMEMODE BEGINPLAY =========="));

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

        // Possess the character
        APlayerController* PC = GetWorld()->GetFirstPlayerController();
        if (PC)
        {
            APawn* CharacterPawn = Cast<APawn>(SpawnedCharacter);
            if (CharacterPawn)
            {
                PC->Possess(CharacterPawn);
                UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] Player now possessing GLB character!"));
            }
        }
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("[MiladyCity] Failed to load character"));
    }
}