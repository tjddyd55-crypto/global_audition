import { useQuery } from '@tanstack/react-query'
import { ChannelsListPanel } from '../../src/screens/ChannelsListPanel'
import { Screen } from '../../src/ui/Screen'
import { channelApi } from '../../src/api/channel'
import { queryKeys } from '../../src/api/queryKeys'

export default function ChannelsTabScreen() {
  const query = useQuery({ queryKey: queryKeys.channelsPublic, queryFn: channelApi.listPublic })

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <ChannelsListPanel />
    </Screen>
  )
}
