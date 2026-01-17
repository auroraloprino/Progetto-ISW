import { ref, computed, onMounted, onUnmounted } from "vue";
import { invitesAPI } from "../services/invitesAPI";

export function useInvitesBadge() {
  const invitesCount = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  const tagInvitesCount = ref(0);
  const boardInvitesCount = ref(0);

  const refreshDetailed = async () => {
    try {
      const list = await invitesAPI.getPending();
      const tag = list.filter(i => i.type === "tag").length;
      const board = list.filter(i => i.type === "board").length;
      tagInvitesCount.value = tag;
      boardInvitesCount.value = board;
      invitesCount.value = list.length;
    } catch {
      invitesCount.value = 0;
      tagInvitesCount.value = 0;
      boardInvitesCount.value = 0;
    }
  };

  onMounted(async () => {
    await refreshDetailed();
    timer = setInterval(refreshDetailed, 20000);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
    timer = null;
  });

  return {
    invitesCount: computed(() => invitesCount.value),
    tagInvitesCount: computed(() => tagInvitesCount.value),
    boardInvitesCount: computed(() => boardInvitesCount.value),
    refreshInvitesCount: refreshDetailed,
  };
}