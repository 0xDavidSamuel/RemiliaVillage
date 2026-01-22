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
    
    // Hardcode load the LoginWidget class
    LoginWidgetClass = LoadClass<ULoginWidget>(nullptr, TEXT("/Game/WBP_Login.WBP_Login_C"));
    
    if (LoginWidgetClass)
    {
        UE_LOG(LogTemp, Log, TEXT("[AuthService] Initialized - LoginWidget loaded"));
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("[AuthService] Failed to load WBP_Login!"));
    }
}

void UAuthService::Login()
{
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

FString UAuthService::GetURLParam(const FString& URL, const FString& ParamName)
{
    FString SearchKey = ParamName + TEXT("=");
    FString Result;
    
    if (URL.Contains(SearchKey))
    {
        FString Right;
        URL.Split(SearchKey, nullptr, &Right);
        
        // Get value until next & or end of string
        if (Right.Contains(TEXT("&")))
        {
            Right.Split(TEXT("&"), &Result, nullptr);
        }
        else
        {
            Result = Right;
        }
        
        // URL decode the result
        Result = FGenericPlatformHttp::UrlDecode(Result);
    }
    
    return Result;
}

void UAuthService::HandleRedirect(const FString& RedirectURL)
{
    UE_LOG(LogTemp, Log, TEXT("[AuthService] Handling redirect: %s"), *RedirectURL);

    // Parse wallet
    WalletAddress = GetURLParam(RedirectURL, TEXT("wallet"));
    
    if (WalletAddress.IsEmpty())
    {
        if (RedirectURL.Contains(TEXT("error=")))
        {
            UE_LOG(LogTemp, Error, TEXT("[AuthService] Auth error in redirect"));
        }
        else
        {
            UE_LOG(LogTemp, Error, TEXT("[AuthService] Invalid redirect URL - no wallet found"));
        }
        OnAuthComplete.Broadcast(false, TEXT(""), FPlayerData());
        return;
    }

    // Parse player data
    CurrentPlayerData = FPlayerData();
    
    // Check for NFT (tokenId) first
    FString TokenId = GetURLParam(RedirectURL, TEXT("tokenId"));
    if (!TokenId.IsEmpty())
    {
        CurrentPlayerData.TokenId = TokenId;
        UE_LOG(LogTemp, Log, TEXT("[AuthService] NFT character - TokenId: %s"), *TokenId);
        // TODO: Fetch model URL from contract using tokenId
    }
    else
    {
        // Demo character - get player data directly
        FString PlayerIdStr = GetURLParam(RedirectURL, TEXT("playerId"));
        if (!PlayerIdStr.IsEmpty())
        {
            CurrentPlayerData.PlayerId = FCString::Atoi(*PlayerIdStr);
        }
        
        CurrentPlayerData.PlayerName = GetURLParam(RedirectURL, TEXT("playerName"));
        CurrentPlayerData.ModelURL = GetURLParam(RedirectURL, TEXT("model"));
        
        UE_LOG(LogTemp, Log, TEXT("[AuthService] Demo character - ID: %d, Name: %s, Model: %s"), 
            CurrentPlayerData.PlayerId, 
            *CurrentPlayerData.PlayerName, 
            *CurrentPlayerData.ModelURL);
    }

    UE_LOG(LogTemp, Log, TEXT("[AuthService] Login success! Wallet: %s"), *WalletAddress);
    OnAuthComplete.Broadcast(true, WalletAddress, CurrentPlayerData);
}

void UAuthService::Logout()
{
    WalletAddress.Empty();
    SessionToken.Empty();
    CurrentPlayerData = FPlayerData();
    UE_LOG(LogTemp, Log, TEXT("[AuthService] Logged out"));
}