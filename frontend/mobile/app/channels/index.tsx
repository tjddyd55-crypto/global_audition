import { Redirect } from 'expo-router'

/** Deep link / stack entry — tab is the primary surface. */
export default function ChannelsStackRedirect() {
  return <Redirect href="/(tabs)/channels" />
}
