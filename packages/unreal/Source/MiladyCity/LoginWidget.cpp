// LoginWidget.cpp

#include "LoginWidget.h"
#include "SWebBrowser.h"
#include "Widgets/Layout/SBox.h"

TSharedRef<SWidget> ULoginWidget::RebuildWidget()
{
	WebBrowser = SNew(SWebBrowser)
		.InitialURL(TEXT("about:blank"))
		.ShowControls(false)
		.SupportsTransparency(false);

	return SNew(SBox)
		.HAlign(HAlign_Fill)
		.VAlign(VAlign_Fill)
		[
			WebBrowser.ToSharedRef()
		];
}

void ULoginWidget::NativeDestruct()
{
	WebBrowser.Reset();
	Super::NativeDestruct();
}

void ULoginWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);

	if (WebBrowser.IsValid())
	{
		FString CurrentURL = WebBrowser->GetUrl();
        
		if (CurrentURL != LastURL)
		{
			LastURL = CurrentURL;
			UE_LOG(LogTemp, Log, TEXT("[LoginWidget] URL changed: %s"), *CurrentURL);

			// Check if this is our redirect
			if (CurrentURL.StartsWith(RedirectScheme))
			{
				UE_LOG(LogTemp, Log, TEXT("[LoginWidget] Caught redirect!"));
				OnLoginRedirect.Broadcast(CurrentURL);
				CloseLogin();
			}
		}
	}
}

void ULoginWidget::LoadLoginURL(const FString& URL)
{
	if (WebBrowser.IsValid())
	{
		UE_LOG(LogTemp, Log, TEXT("[LoginWidget] Loading URL: %s"), *URL);
		WebBrowser->LoadURL(URL);
	}
}

void ULoginWidget::CloseLogin()
{
	RemoveFromParent();
}