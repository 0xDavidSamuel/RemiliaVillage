// AuthService.h

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "AuthService.generated.h"

class ULoginWidget;

// Player data struct
USTRUCT(BlueprintType)
struct FPlayerData
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly, Category = "Player")
    int32 PlayerId = 0;

    UPROPERTY(BlueprintReadOnly, Category = "Player")
    FString PlayerName;

    UPROPERTY(BlueprintReadOnly, Category = "Player")
    FString ModelURL;

    UPROPERTY(BlueprintReadOnly, Category = "Player")
    FString TokenId;

    bool IsNFT() const { return !TokenId.IsEmpty(); }
    bool IsValid() const { return !ModelURL.IsEmpty() || !TokenId.IsEmpty(); }
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnAuthComplete, bool, bSuccess, const FString&, WalletAddress, const FPlayerData&, PlayerData);

UCLASS()
class MILADYCITY_API UAuthService : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    UFUNCTION(BlueprintCallable, Category = "Auth")
    void Login();

    UFUNCTION(BlueprintCallable, Category = "Auth")
    void HandleRedirect(const FString& RedirectURL);

    UFUNCTION(BlueprintCallable, Category = "Auth")
    void Logout();

    UFUNCTION(BlueprintPure, Category = "Auth")
    bool IsLoggedIn() const { return !WalletAddress.IsEmpty(); }

    UFUNCTION(BlueprintPure, Category = "Auth")
    FString GetWalletAddress() const { return WalletAddress; }

    UFUNCTION(BlueprintPure, Category = "Auth")
    FPlayerData GetPlayerData() const { return CurrentPlayerData; }

    UPROPERTY(BlueprintAssignable, Category = "Auth")
    FOnAuthComplete OnAuthComplete;

    UPROPERTY(EditDefaultsOnly, Category = "Auth")
    TSubclassOf<ULoginWidget> LoginWidgetClass;

private:
    UFUNCTION()
    void OnLoginWidgetRedirect(const FString& RedirectURL);

    // Helper to parse URL params
    FString GetURLParam(const FString& URL, const FString& ParamName);

    FString ClientId = TEXT("BF2EVKFTFs7vxgCdWBSZ_5hyt61jR_YBtSrBcUji7qX145r3s3b7TvNGXzlgnqYzC73aoOlrJxe-NwyzYEWktx0");
    FString RedirectUri = TEXT("miladycity://auth");
    
    FString WalletAddress;
    FString SessionToken;
    FPlayerData CurrentPlayerData;

    UPROPERTY()
    ULoginWidget* ActiveLoginWidget;
};