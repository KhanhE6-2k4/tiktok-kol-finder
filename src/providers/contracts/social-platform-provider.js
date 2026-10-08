export class SocialPlatformProvider {
  getPlatform() {
    throw new Error('getPlatform() must be implemented');
  }

  async discover(criteria) {
    throw new Error('discover() must be implemented');
  }

  normalize(item, context = {}) {
    throw new Error('normalize() must be implemented');
  }
}
