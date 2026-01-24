// Copyright Epic Games, Inc. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "AuthService.h"
#include "MiladyCityGameMode.generated.h"

class AGLBCharacterLoader;

UCLASS(Blueprintable)
class MILADYCITY_API AMiladyCityGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	AMiladyCityGameMode();

protected:
	virtual void BeginPlay() override;

	UFUNCTION()
	void OnAuthComplete(bool bSuccess, const FString& WalletAddress, const FPlayerData& PlayerData);

	UFUNCTION()
	void OnCharacterLoaded(AActor* SpawnedCharacter);

private:
	UPROPERTY()
	AGLBCharacterLoader* CharacterLoader;

	FString BaseURL = TEXT("https://remilia-village.vercel.app");
};