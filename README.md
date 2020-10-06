# Xcode Test

This Action tests an Xcode project.

> This Action has mostly been tested on macOS products. Although it probably just works, the goal is to support iOS and watchOS officially with the next release of this Action.

## Basic Usage

For simple projects where there is one scheme, invoking `xcode-archive` can be as simple as this:

```yaml
- name: "Archive"
  uses: devbotsxyz/xcode-test@v1
```

## Full Example

The [devbotsxyz/example-macos-rings](https://github.com/devbotsxyz/example-macos-rings) project is an example macOS project with a [release.yml](https://github.com/devbotsxyz/example-macos-rings/.github/workflows/release.yml) workflow that shows all the steps needed to go from creating a release in GitHub to ending up with a `.zip` file that contains a signed and notarized application.

## Related Actions

 * [Carthage Bootstrap](https://github.com/marketplace/actions/xcode-staple) - Bootstrap your Carthage Dependencies/
 * [Xcode Notarize](https://github.com/marketplace/actions/xcode-notarize) - Notarize a macOS product.
 * [Xcode Staple](https://github.com/marketplace/actions/xcode-staple) - Staple a Notarization Ticket to your product.

## License and Contributions

This Action is licensed under the [MIT](LICENSE) license. Contributions are very much welcome and encouraged but we would like to ask to file an issue before submitting pull requests.
