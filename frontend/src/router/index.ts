import { createRouter, createWebHistory } from 'vue-router'
import CalendarioComponent from '../components/CalendarioComponent.vue'

const routes = [
  {
    path: '/',
    redirect: '/calendario'
  },
  {
    path: '/calendario',
    name: 'Calendario',
    component: CalendarioComponent
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router