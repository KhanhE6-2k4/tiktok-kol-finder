export class ProviderRegistry {
  constructor(providers) {
    this.providers = new Map(providers.map(provider => [
      provider.getPlatform(),
      provider
    ]));
  }

  get(platform) {
    const provider = this.providers.get(platform);

    if (!provider) {
      throw new Error(
        `Unsupported platform: ${platform}`
      );
    }

    return provider;
  }
}
