// AuthService.cpp

#include "AuthService.h"
#include "WebService.h"
#include "LoginWidget.h"
#include "Engine/GameInstance.h"
#include "GenericPlatform/GenericPlatformHttp.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonSerializer.h"

void UAuthService::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    UE_LOG(LogTemp, Log, TEXT("[AuthService] Initialized"));
}

void UAuthService::Login()
{
    // TODO: Replace with your Vercel URL after deployment
    FString LoginUrl = TEXT("https://remilia-village.vercel.app?redirect_uri=miladycity://auth");

    UE_LOG(LogTemp, Log, TEXT("[AuthService] Login URL: %s"), *LoginUrl);

    // Create and show login widget
    if (LoginWidgetClass)
    {
        UWorld* World = GetGameInstance()->GetWorld();
        if (World)
        {
            ActiveLoginWidget = CreateWidget<ULoginWidget>(World, LoginWidgetClass);
            if (ActiveLoginWidget)
            {
                ActiveLoginWidget->OnLoginRedirect.AddDynamic(this, &UAuthService::OnLoginWidgetRedirect);
                ActiveLoginWidget->AddToViewport(100);
                ActiveLoginWidget->LoadLoginURL(LoginUrl);
                
                APlayerController* PC = World->GetFirstPlayerController();
                if (PC)
                {
                    PC->SetShowMouseCursor(true);
                }
                
                UE_LOG(LogTemp, Log, TEXT("[AuthService] Login widget displayed"));
            }
        }
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("[AuthService] LoginWidgetClass not set!"));
    }
}

void UAuthService::OnLoginWidgetRedirect(const FString& RedirectURL)
{
    UE_LOG(LogTemp, Log, TEXT("[AuthService] Got redirect from widget: %s"), *RedirectURL);
    
    UWorld* World = GetGameInstance()->GetWorld();
    if (World)
    {
        APlayerController* PC = World->GetFirstPlayerController();
        if (PC)
        {
            PC->SetShowMouseCursor(false);
        }
    }
    
    ActiveLoginWidget = nullptr;
    HandleRedirect(RedirectURL);
}

void UAuthService::HandleRedirect(const FString& RedirectURL)
{
    UE_LOG(LogTemp, Log, TEXT("[AuthService] Handling redirect: %s"), *RedirectURL);

    // Expected format: miladycity://auth?wallet=0x123...
    if (RedirectURL.Contains(TEXT("wallet=")))
    {
        FString Right;
        RedirectURL.Split(TEXT("wallet="), nullptr, &Right);
        
        // Remove any trailing parameters
        if (Right.Contains(TEXT("&")))
        {
            Right.Split(TEXT("&"), &WalletAddress, nullptr);
        }
        else
        {
            WalletAddress = Right;
        }

        UE_LOG(LogTemp, Log, TEXT("[AuthService] Login success! Wallet: %s"), *WalletAddress);
        OnAuthComplete.Broadcast(true, WalletAddress);
    }
    else if (RedirectURL.Contains(TEXT("error=")))
    {
        UE_LOG(LogTemp, Error, TEXT("[AuthService] Auth error in redirect"));
        OnAuthComplete.Broadcast(false, TEXT(""));
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("[AuthService] Invalid redirect URL - no wallet found"));
        OnAuthComplete.Broadcast(false, TEXT(""));
    }
}

void UAuthService::Logout()
{
    WalletAddress.Empty();
    SessionToken.Empty();
    UE_LOG(LogTemp, Log, TEXT("[AuthService] Logged out"));
}
