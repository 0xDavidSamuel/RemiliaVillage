// GLBCharacter.h
#pragma once

#include "CoreMinimal.h"
#include "MiladyCityCharacter.h"
#include "GLBCharacter.generated.h"

UCLASS()
class MILADYCITY_API AGLBCharacter : public AMiladyCityCharacter
{
	GENERATED_BODY()

public:
	AGLBCharacter();

	virtual void BeginPlay() override;
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	// Attach loaded skeletal meshes to this character
	UFUNCTION(BlueprintCallable, Category = "GLB")
	void AttachGLBMeshes(const TArray<USkeletalMesh*>& Meshes);

	// Get the container for GLB meshes
	UFUNCTION(BlueprintPure, Category = "GLB")
	USceneComponent* GetGLBRoot() const { return GLBMeshRoot; }

protected:
	// Root component for attached GLB meshes
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "GLB")
	USceneComponent* GLBMeshRoot;

	// Keep references to spawned mesh components
	UPROPERTY()
	TArray<USkeletalMeshComponent*> GLBMeshComponents;
};