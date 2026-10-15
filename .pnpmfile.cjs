// TypeScript 7 supplies the build CLI; ESLint's parser still needs the legacy JS API.
// Scope the compatibility dependency to lint tooling rather than downgrading the app.
module.exports = {
  hooks: {
    readPackage(pkg) {
      const usesLegacyApi =
        pkg.name.startsWith("@typescript-eslint/") ||
        [
          "typescript-eslint",
          "ts-api-utils",
          "eslint-config-next",
          "eslint-import-resolver-typescript",
        ].includes(pkg.name);
      if (usesLegacyApi && pkg.peerDependencies?.typescript) {
        delete pkg.peerDependencies.typescript;
        pkg.dependencies = { ...pkg.dependencies, typescript: "6.0.3" };
      }
      return pkg;
    },
  },
};
