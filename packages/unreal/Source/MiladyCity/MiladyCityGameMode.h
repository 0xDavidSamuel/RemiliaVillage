// Copyright Epic Games, Inc. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "MiladyCityGameMode.generated.h"

UCLASS(abstract)
class AMiladyCityGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    AMiladyCityGameMode();

protected:
    virtual void BeginPlay() override;

    UFUNCTION()
    void OnAuthComplete(bool bSuccess, const FString& WalletAddress);
};
