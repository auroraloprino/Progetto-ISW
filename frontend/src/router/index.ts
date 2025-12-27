import { createRouter, createWebHistory } from 'vue-router'
import CalendarioComponent from '../components/CalendarioComponent.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import { currentUser } from '../auth/auth'


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
  { path:'/', component:CalendarioComponent },
  { path:'/login', component:LoginView },
  { path:'/register', component:RegisterView },
  { path:'/dashboard', component:DashboardView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to,from,next)=>{
 if(to.path==='/dashboard' && !currentUser()) next('/login')
 else next()
})


export default router
