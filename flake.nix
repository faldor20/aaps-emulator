{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flakelight.url = "github:nix-community/flakelight";
  };
  outputs = { flakelight, ... }@inputs:
    flakelight ./. {
      inherit inputs;
      devShell.packages = pkgs: [ pkgs.pnpm pkgs.nodejs-slim_22   ];
    };
}