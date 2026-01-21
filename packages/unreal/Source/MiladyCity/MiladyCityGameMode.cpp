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
          // Load the login widget class at runtime
          UClass* WidgetClass = LoadClass<ULoginWidget>(nullptr, TEXT("/Game/WBP_Login.WBP_Login_C"));
          if (WidgetClass)
          {
             Auth->LoginWidgetClass = WidgetClass;
             UE_LOG(LogTemp, Log, TEXT("[MiladyCity] Loaded WBP_Login widget"));
          }
          else
          {
             UE_LOG(LogTemp, Error, TEXT("[MiladyCity] Could not find WBP_Login widget!"));
          }

          // Listen for auth result
          Auth->OnAuthComplete.AddDynamic(this, &AMiladyCityGameMode::OnAuthComplete);
            
          // Start login
          UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] Starting login..."));
          Auth->Login();
       }
    }
}

void AMiladyCityGameMode::OnAuthComplete(bool bSuccess, const FString& WalletAddress)
{
    if (bSuccess)
    {
       UE_LOG(LogTemp, Warning, TEXT("[MiladyCity] LOGIN SUCCESS! Wallet: %s"), *WalletAddress);
    }
    else
    {
       UE_LOG(LogTemp, Error, TEXT("[MiladyCity] LOGIN FAILED"));
    }
}
