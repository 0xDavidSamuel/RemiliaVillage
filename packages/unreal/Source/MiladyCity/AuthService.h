// AuthService.h

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "AuthService.generated.h"

class ULoginWidget;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnAuthComplete, bool, bSuccess, const FString&, WalletAddress);

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

    UPROPERTY(BlueprintAssignable, Category = "Auth")
    FOnAuthComplete OnAuthComplete;

    UPROPERTY(EditDefaultsOnly, Category = "Auth")
    TSubclassOf<ULoginWidget> LoginWidgetClass;

private:
    UFUNCTION()
    void OnLoginWidgetRedirect(const FString& RedirectURL);

    FString ClientId = TEXT("BF2EVKFTFs7vxgCdWBSZ_5hyt61jR_YBtSrBcUji7qX145r3s3b7TvNGXzlgnqYzC73aoOlrJxe-NwyzYEWktx0");
    FString RedirectUri = TEXT("miladycity://auth");
    
    FString WalletAddress;
    FString SessionToken;

    UPROPERTY()
    ULoginWidget* ActiveLoginWidget;
};
