import { createRouter, createWebHistory } from 'vue-router'

import CalendarioComponent from '../components/CalendarioComponent.vue'
import LoginView from '../views/Login.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'

import { currentUser } from '../auth/auth'

const routes = [
  { path: '/', redirect: '/calendario' },

  {
    path: '/calendario',
    component: CalendarioComponent,
    meta: { auth: true }
  },
  {
    path: '/dashboard',      
    component: DashboardView,
    meta: { auth: true }
  },

  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _, next) => {
  if (to.meta.auth && !currentUser()) {
    next('/login')
  } else {
    next()
  }
})

export default router