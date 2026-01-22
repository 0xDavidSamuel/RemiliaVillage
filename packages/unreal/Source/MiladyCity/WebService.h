// WebService.h
// Core HTTP service for all web requests (Web3Auth, IPFS, JSON-RPC)

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Dom/JsonObject.h"
#include "WebService.generated.h"

// Callback delegates
DECLARE_DELEGATE_TwoParams(FOnWebRequestComplete, bool /*bSuccess*/, TSharedPtr<FJsonObject> /*Response*/);
DECLARE_DELEGATE_TwoParams(FOnWebRequestRaw, bool /*bSuccess*/, const TArray<uint8>& /*Data*/);

/**
 * Central HTTP service for all external API communication.
 * Lives on the GameInstance so it persists across level loads.
 * 
 * Usage:
 *   UWebService* Web = GetGameInstance()->GetSubsystem<UWebService>();
 *   Web->GetJson(URL, FOnWebRequestComplete::CreateLambda([](bool bOK, TSharedPtr<FJsonObject> Data) { ... }));
 */
UCLASS()
class MILADYCITY_API UWebService : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    // JSON Requests
    void GetJson(
        const FString& URL,
        FOnWebRequestComplete Callback,
        const TMap<FString, FString>& Headers = {}
    );

    void PostJson(
        const FString& URL,
        TSharedPtr<FJsonObject> Body,
        FOnWebRequestComplete Callback,
        const TMap<FString, FString>& Headers = {}
    );

    // Raw Requests (for binary data like GLB files)
    void GetRaw(
        const FString& URL,
        FOnWebRequestRaw Callback
    );

    // JSON-RPC Helper (for Ethereum calls)
    void JsonRpc(
        const FString& RpcUrl,
        const FString& Method,
        const TArray<TSharedPtr<FJsonValue>>& Params,
        FOnWebRequestComplete Callback
    );

    void CancelAllRequests();
    bool HasPendingRequests() const { return ActiveRequests.Num() > 0; }

protected:
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> CreateRequest(
        const FString& Verb,
        const FString& URL,
        const TMap<FString, FString>& Headers
    );

    void HandleJsonResponse(
        FHttpRequestPtr Request,
        FHttpResponsePtr Response,
        bool bConnectedSuccessfully,
        FOnWebRequestComplete Callback
    );

    void HandleRawResponse(
        FHttpRequestPtr Request,
        FHttpResponsePtr Response,
        bool bConnectedSuccessfully,
        FOnWebRequestRaw Callback
    );

private:
    TArray<TSharedPtr<IHttpRequest, ESPMode::ThreadSafe>> ActiveRequests;
};