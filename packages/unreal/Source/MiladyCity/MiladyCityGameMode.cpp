// Copyright Epic Games, Inc. All Rights Reserved.

#include "MiladyCityGameMode.h"
#include "WebService.h"
#include "AuthService.h"
#include "LoginWidget.h"
#include "Engine/GameInstance.h"
#include "Kismet/GameplayStatics.h"

AMiladyCityGameMode::AMiladyCityGameMode()
{
}

void AMiladyCityGameMode::BeginPlay()
{
	Super::BeginPlay();

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
			// TODO: Fetch model from chain using TokenId
		}
		else if (PlayerData.IsValid())
		{
			UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] Demo Character - ID: %d, Name: %s"), PlayerData.PlayerId, *PlayerData.PlayerName);
			UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] Model URL: %s"), *PlayerData.ModelURL);
			// TODO: Load GLB from ModelURL and spawn character
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