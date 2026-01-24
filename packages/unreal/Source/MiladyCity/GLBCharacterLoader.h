// GLBCharacterLoader.h

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "glTFRuntimeAsset.h"
#include "GLBCharacterLoader.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnCharacterLoaded, AActor*, SpawnedCharacter);

UCLASS()
class MILADYCITY_API AGLBCharacterLoader : public AActor
{
	GENERATED_BODY()

public:
	AGLBCharacterLoader();

	// Load GLB from URL and spawn character
	UFUNCTION(BlueprintCallable, Category = "GLB")
	void LoadCharacterFromURL(const FString& URL, FVector SpawnLocation, FRotator SpawnRotation);

	// Called when character is loaded and spawned
	UPROPERTY(BlueprintAssignable, Category = "GLB")
	FOnCharacterLoaded OnCharacterLoaded;

private:
	void OnGLBDownloaded(TSharedPtr<IHttpRequest, ESPMode::ThreadSafe> Request, TSharedPtr<IHttpResponse, ESPMode::ThreadSafe> Response, bool bWasSuccessful);
    
	FVector PendingSpawnLocation;
	FRotator PendingSpawnRotation;
};