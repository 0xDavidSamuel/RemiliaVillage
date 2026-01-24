// GLBCharacter.cpp

#include "GLBCharacter.h"
#include "Components/SkeletalMeshComponent.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "InputMappingContext.h"
#include "InputAction.h"

AGLBCharacter::AGLBCharacter()
{
    // Create a root for GLB meshes, attached to the character's mesh
    GLBMeshRoot = CreateDefaultSubobject<USceneComponent>(TEXT("GLBMeshRoot"));
    GLBMeshRoot->SetupAttachment(GetMesh());
}

void AGLBCharacter::BeginPlay()
{
    Super::BeginPlay();

    // Add Input Mapping Context
    if (APlayerController* PlayerController = Cast<APlayerController>(GetController()))
    {
        if (UEnhancedInputLocalPlayerSubsystem* Subsystem = ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(PlayerController->GetLocalPlayer()))
        {
            // Load and add the default input mapping context
            UInputMappingContext* IMC = LoadObject<UInputMappingContext>(nullptr, TEXT("/Game/Input/IMC_Default.IMC_Default"));
            if (IMC)
            {
                Subsystem->AddMappingContext(IMC, 0);
                UE_LOG(LogTemp, Log, TEXT("[GLBCharacter] Input mapping context added"));
            }
            else
            {
                UE_LOG(LogTemp, Error, TEXT("[GLBCharacter] Failed to load IMC_Default"));
            }
        }
    }
}

void AGLBCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    // Load input actions
    UInputAction* IA_Move = LoadObject<UInputAction>(nullptr, TEXT("/Game/Input/Actions/IA_Move.IA_Move"));
    UInputAction* IA_Look = LoadObject<UInputAction>(nullptr, TEXT("/Game/Input/Actions/IA_Look.IA_Look"));
    UInputAction* IA_MouseLook = LoadObject<UInputAction>(nullptr, TEXT("/Game/Input/Actions/IA_MouseLook.IA_MouseLook"));
    UInputAction* IA_Jump = LoadObject<UInputAction>(nullptr, TEXT("/Game/Input/Actions/IA_Jump.IA_Jump"));

    if (UEnhancedInputComponent* EnhancedInputComponent = Cast<UEnhancedInputComponent>(PlayerInputComponent))
    {
        if (IA_Move)
        {
            EnhancedInputComponent->BindAction(IA_Move, ETriggerEvent::Triggered, this, &AGLBCharacter::Move);
            UE_LOG(LogTemp, Log, TEXT("[GLBCharacter] Bound IA_Move"));
        }
        else
        {
            UE_LOG(LogTemp, Error, TEXT("[GLBCharacter] Failed to load IA_Move"));
        }
        
        if (IA_Look)
        {
            EnhancedInputComponent->BindAction(IA_Look, ETriggerEvent::Triggered, this, &AGLBCharacter::Look);
            UE_LOG(LogTemp, Log, TEXT("[GLBCharacter] Bound IA_Look"));
        }
        else
        {
            UE_LOG(LogTemp, Error, TEXT("[GLBCharacter] Failed to load IA_Look"));
        }

        if (IA_MouseLook)
        {
            EnhancedInputComponent->BindAction(IA_MouseLook, ETriggerEvent::Triggered, this, &AGLBCharacter::Look);
            UE_LOG(LogTemp, Log, TEXT("[GLBCharacter] Bound IA_MouseLook"));
        }
        else
        {
            UE_LOG(LogTemp, Error, TEXT("[GLBCharacter] Failed to load IA_MouseLook"));
        }
        
        if (IA_Jump)
        {
            EnhancedInputComponent->BindAction(IA_Jump, ETriggerEvent::Started, this, &ACharacter::Jump);
            EnhancedInputComponent->BindAction(IA_Jump, ETriggerEvent::Completed, this, &ACharacter::StopJumping);
            UE_LOG(LogTemp, Log, TEXT("[GLBCharacter] Bound IA_Jump"));
        }
        else
        {
            UE_LOG(LogTemp, Error, TEXT("[GLBCharacter] Failed to load IA_Jump"));
        }
    }
}

void AGLBCharacter::AttachGLBMeshes(const TArray<USkeletalMesh*>& Meshes)
{
    // Clear any existing
    for (USkeletalMeshComponent* Comp : GLBMeshComponents)
    {
        if (Comp)
        {
            Comp->DestroyComponent();
        }
    }
    GLBMeshComponents.Empty();

    // Rotate the GLB root to fix model orientation (Blender exports face camera by default)
    GLBMeshRoot->SetRelativeRotation(FRotator(0, 180, 0));

    // Attach each mesh
    for (int32 i = 0; i < Meshes.Num(); i++)
    {
        if (Meshes[i])
        {
            USkeletalMeshComponent* MeshComp = NewObject<USkeletalMeshComponent>(this);
            MeshComp->SetupAttachment(GLBMeshRoot);
            MeshComp->RegisterComponent();
            MeshComp->SetSkeletalMesh(Meshes[i]);
            
            GLBMeshComponents.Add(MeshComp);
            
            UE_LOG(LogTemp, Log, TEXT("[GLBCharacter] Attached mesh %d"), i);
        }
    }

    // Hide the default mesh since we're using GLB meshes
    GetMesh()->SetVisibility(false);
    
    UE_LOG(LogTemp, Log, TEXT("[GLBCharacter] Total meshes attached: %d"), GLBMeshComponents.Num());
}