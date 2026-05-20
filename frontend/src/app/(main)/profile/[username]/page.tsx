import { ProfileView } from '@/components/profile/ProfileView'

export default function ProfilePage({
  params,
}: {
  params: { username: string }
}) {
  return <ProfileView username={params.username} />
}