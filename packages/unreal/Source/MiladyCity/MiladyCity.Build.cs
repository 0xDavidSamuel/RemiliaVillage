// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;

public class MiladyCity : ModuleRules
{
	public MiladyCity(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] {
			"Core",
			"CoreUObject",
			"Engine",
			"InputCore",
			"EnhancedInput",
			"AIModule",
			"StateTreeModule",
			"GameplayStateTreeModule",
			"UMG",
			"Slate",
			"SlateCore",
			"HTTP",
			"Json",
			"JsonUtilities",
			"WebBrowser",
			"glTFRuntime"
		});

		PrivateDependencyModuleNames.AddRange(new string[] { });

		PublicIncludePaths.AddRange(new string[] {
			"MiladyCity",
			"MiladyCity/Variant_Platforming",
			"MiladyCity/Variant_Platforming/Animation",
			"MiladyCity/Variant_Combat",
			"MiladyCity/Variant_Combat/AI",
			"MiladyCity/Variant_Combat/Animation",
			"MiladyCity/Variant_Combat/Gameplay",
			"MiladyCity/Variant_Combat/Interfaces",
			"MiladyCity/Variant_Combat/UI",
			"MiladyCity/Variant_SideScrolling",
			"MiladyCity/Variant_SideScrolling/AI",
			"MiladyCity/Variant_SideScrolling/Gameplay",
			"MiladyCity/Variant_SideScrolling/Interfaces",
			"MiladyCity/Variant_SideScrolling/UI"
		});
	}
}