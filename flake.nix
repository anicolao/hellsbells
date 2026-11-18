{
  description = "Hell's Bells SvelteKit development environment";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  # Match the tested runtime; Bun 1.4 stalls Firebase's compat test client.
  inputs.bunpkgs.url = "github:NixOS/nixpkgs/0954f7ee2f6bb3dc7d4e3d0d8bcb8fd4bde4cfc5";
  outputs = { self, nixpkgs, bunpkgs }: let
    systems = [ "aarch64-darwin" "x86_64-darwin" "x86_64-linux" "aarch64-linux" ];
    forAllSystems = nixpkgs.lib.genAttrs systems;
  in {
    devShells = forAllSystems (system: let pkgs = import nixpkgs { inherit system; }; stableBun = (import bunpkgs { inherit system; }).bun; in {
      default = pkgs.mkShell {
        packages = with pkgs; [ stableBun nodejs git ripgrep poppler-utils firebase-tools jdk ] ++ lib.optionals stdenv.hostPlatform.isLinux [ chromium ];
        shellHook = pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isLinux ''
          export PLAYWRIGHT_CHROMIUM_EXECUTABLE="${pkgs.chromium}/bin/chromium"
        '';
      };
    });
  };
}
