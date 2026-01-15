<template>
  <NavBar v-if="showNav" />
  <RouterView />
</template>

<script setup lang="ts">
import NavBar from "./components/NavBar.vue";
import { onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import { getToken } from "./auth/auth";
import { useNotifications } from "./composables/useNotifications";

const route = useRoute();

const showNav = computed(() => {
  const publicRoutes = ["/login", "/register"];
  const isPublic = publicRoutes.includes(route.path);
  const loggedIn = !!getToken();
  return loggedIn && !isPublic;
});

const { initialize, cleanup } = useNotifications();

onMounted(() => {
  initialize();
});

onUnmounted(() => {
  cleanup();
});
</script>
