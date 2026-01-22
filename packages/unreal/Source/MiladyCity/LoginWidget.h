// LoginWidget.h
// In-app browser widget for Web3Auth login

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "LoginWidget.generated.h"

class SWebBrowser;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnLoginRedirect, const FString&, RedirectURL);

UCLASS()
class MILADYCITY_API ULoginWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	// Call this to start the login flow
	UFUNCTION(BlueprintCallable, Category = "Login")
	void LoadLoginURL(const FString& URL);

	// Close the widget
	UFUNCTION(BlueprintCallable, Category = "Login")
	void CloseLogin();

	// Fires when we catch the redirect
	UPROPERTY(BlueprintAssignable, Category = "Login")
	FOnLoginRedirect OnLoginRedirect;

protected:
	virtual TSharedRef<SWidget> RebuildWidget() override;
	virtual void NativeDestruct() override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

private:
	TSharedPtr<SWebBrowser> WebBrowser;
	FString RedirectScheme = TEXT("miladycity://");
	FString LastURL;
};