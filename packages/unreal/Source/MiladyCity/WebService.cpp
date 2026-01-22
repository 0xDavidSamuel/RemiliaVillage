// WebService.cpp

#include "WebService.h"
#include "HttpModule.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonSerializer.h"

void UWebService::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    UE_LOG(LogTemp, Log, TEXT("[WebService] Initialized"));
}

void UWebService::Deinitialize()
{
    CancelAllRequests();
    Super::Deinitialize();
}

void UWebService::GetJson(
    const FString& URL,
    FOnWebRequestComplete Callback,
    const TMap<FString, FString>& Headers)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = CreateRequest(TEXT("GET"), URL, Headers);
    Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
    
    Request->OnProcessRequestComplete().BindUObject(
        this, 
        &UWebService::HandleJsonResponse, 
        Callback
    );
    
    ActiveRequests.Add(Request);
    Request->ProcessRequest();
    
    UE_LOG(LogTemp, Log, TEXT("[WebService] GET JSON: %s"), *URL);
}

void UWebService::PostJson(
    const FString& URL,
    TSharedPtr<FJsonObject> Body,
    FOnWebRequestComplete Callback,
    const TMap<FString, FString>& Headers)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = CreateRequest(TEXT("POST"), URL, Headers);
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
    
    FString BodyString;
    if (Body.IsValid())
    {
        TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&BodyString);
        FJsonSerializer::Serialize(Body.ToSharedRef(), Writer);
    }
    Request->SetContentAsString(BodyString);
    
    Request->OnProcessRequestComplete().BindUObject(
        this, 
        &UWebService::HandleJsonResponse, 
        Callback
    );
    
    ActiveRequests.Add(Request);
    Request->ProcessRequest();
    
    UE_LOG(LogTemp, Log, TEXT("[WebService] POST JSON: %s"), *URL);
}

void UWebService::GetRaw(const FString& URL, FOnWebRequestRaw Callback)
{
    TMap<FString, FString> EmptyHeaders;
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = CreateRequest(TEXT("GET"), URL, EmptyHeaders);
    
    Request->OnProcessRequestComplete().BindUObject(
        this, 
        &UWebService::HandleRawResponse, 
        Callback
    );
    
    ActiveRequests.Add(Request);
    Request->ProcessRequest();
    
    UE_LOG(LogTemp, Log, TEXT("[WebService] GET Raw: %s"), *URL);
}

void UWebService::JsonRpc(
    const FString& RpcUrl,
    const FString& Method,
    const TArray<TSharedPtr<FJsonValue>>& Params,
    FOnWebRequestComplete Callback)
{
    TSharedPtr<FJsonObject> RpcRequest = MakeShareable(new FJsonObject());
    RpcRequest->SetStringField(TEXT("jsonrpc"), TEXT("2.0"));
    RpcRequest->SetStringField(TEXT("method"), Method);
    RpcRequest->SetArrayField(TEXT("params"), Params);
    RpcRequest->SetNumberField(TEXT("id"), FMath::Rand());
    
    FOnWebRequestComplete WrappedCallback = FOnWebRequestComplete::CreateLambda(
        [Callback](bool bSuccess, TSharedPtr<FJsonObject> Response)
        {
            if (bSuccess && Response.IsValid())
            {
                if (Response->HasField(TEXT("error")))
                {
                    const TSharedPtr<FJsonObject>* ErrorObj;
                    if (Response->TryGetObjectField(TEXT("error"), ErrorObj))
                    {
                        FString ErrorMsg = (*ErrorObj)->GetStringField(TEXT("message"));
                        UE_LOG(LogTemp, Error, TEXT("[WebService] RPC Error: %s"), *ErrorMsg);
                    }
                    Callback.ExecuteIfBound(false, nullptr);
                    return;
                }
                
                if (Response->HasField(TEXT("result")))
                {
                    TSharedPtr<FJsonObject> ResultWrapper = MakeShareable(new FJsonObject());
                    ResultWrapper->SetField(TEXT("result"), Response->TryGetField(TEXT("result")));
                    Callback.ExecuteIfBound(true, ResultWrapper);
                    return;
                }
            }
            Callback.ExecuteIfBound(bSuccess, Response);
        }
    );
    
    TMap<FString, FString> EmptyHeaders;
    PostJson(RpcUrl, RpcRequest, WrappedCallback, EmptyHeaders);
}

void UWebService::CancelAllRequests()
{
    for (auto& Request : ActiveRequests)
    {
        if (Request.IsValid())
        {
            Request->CancelRequest();
        }
    }
    ActiveRequests.Empty();
    UE_LOG(LogTemp, Log, TEXT("[WebService] Cancelled all requests"));
}

TSharedRef<IHttpRequest, ESPMode::ThreadSafe> UWebService::CreateRequest(
    const FString& Verb,
    const FString& URL,
    const TMap<FString, FString>& Headers)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetVerb(Verb);
    Request->SetURL(URL);
    
    for (const auto& Header : Headers)
    {
        Request->SetHeader(Header.Key, Header.Value);
    }
    
    Request->SetTimeout(30.0f);
    
    return Request;
}

void UWebService::HandleJsonResponse(
    FHttpRequestPtr Request,
    FHttpResponsePtr Response,
    bool bConnectedSuccessfully,
    FOnWebRequestComplete Callback)
{
    ActiveRequests.Remove(Request);
    
    if (!bConnectedSuccessfully || !Response.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("[WebService] Request failed - no connection"));
        Callback.ExecuteIfBound(false, nullptr);
        return;
    }
    
    int32 StatusCode = Response->GetResponseCode();
    
    if (StatusCode < 200 || StatusCode >= 300)
    {
        UE_LOG(LogTemp, Error, TEXT("[WebService] HTTP Error %d: %s"), 
            StatusCode, *Response->GetContentAsString());
        Callback.ExecuteIfBound(false, nullptr);
        return;
    }
    
    FString ResponseBody = Response->GetContentAsString();
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(ResponseBody);
    
    if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("[WebService] Failed to parse JSON response"));
        Callback.ExecuteIfBound(false, nullptr);
        return;
    }
    
    UE_LOG(LogTemp, Verbose, TEXT("[WebService] Success: %s"), *Request->GetURL());
    Callback.ExecuteIfBound(true, JsonObject);
}

void UWebService::HandleRawResponse(
    FHttpRequestPtr Request,
    FHttpResponsePtr Response,
    bool bConnectedSuccessfully,
    FOnWebRequestRaw Callback)
{
    ActiveRequests.Remove(Request);
    
    if (!bConnectedSuccessfully || !Response.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("[WebService] Raw request failed - no connection"));
        TArray<uint8> EmptyData;
        Callback.ExecuteIfBound(false, EmptyData);
        return;
    }
    
    int32 StatusCode = Response->GetResponseCode();
    
    if (StatusCode < 200 || StatusCode >= 300)
    {
        UE_LOG(LogTemp, Error, TEXT("[WebService] HTTP Error %d for raw request"), StatusCode);
        TArray<uint8> EmptyData;
        Callback.ExecuteIfBound(false, EmptyData);
        return;
    }
    
    const TArray<uint8>& Content = Response->GetContent();
    UE_LOG(LogTemp, Log, TEXT("[WebService] Raw response: %d bytes"), Content.Num());
    Callback.ExecuteIfBound(true, Content);
}