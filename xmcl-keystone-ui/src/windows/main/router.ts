import { createRouter, createWebHashHistory } from 'vue-router'

// Lazy-loaded route components for code-splitting
const AdminPanel = () => import('@/views/AdminPanel.vue')
const BaseSetting = () => import('@/views/BaseSetting.vue')
const BaseSettingActions = () => import('@/views/BaseSettingActions.vue')
const BaseSettingExtension = () => import('@/views/BaseSettingExtension.vue')
const DashboardHome = () => import('@/views/DashboardHome.vue')
const HomePageNew = () => import('@/views/HomePageNew.vue')
const Me = () => import('@/views/Me.vue')
const Home = () => import('@/views/Home.vue')
const HomeActions = () => import('@/views/HomeActions.vue')
const HomeExtension = () => import('@/views/HomeExtension.vue')
const HomeLayout = () => import('@/views/HomeLayout.vue')
const Mod = () => import('@/views/Mod.vue')
const ModActions = () => import('@/views/ModActions.vue')
const ModExtension = () => import('@/views/ModExtension.vue')
const ResourcePack = () => import('@/views/ResourcePack.vue')
const ResourcePackActions = () => import('@/views/ResourcePackActions.vue')
const ResourcePackExtension = () => import('@/views/ResourcePackExtension.vue')
const Save = () => import('@/views/Save.vue')
const SaveActions = () => import('@/views/SaveActions.vue')
const SaveExtension = () => import('@/views/SaveExtension.vue')
const Library = () => import('@/views/Library.vue')
const SkinLibrary = () => import('@/views/SkinLibrary.vue')
const SkinEditor = () => import('@/views/SkinEditor.vue')
const Servers = () => import('@/views/Servers.vue')
const Multiplayer = () => import('@/views/Multiplayer.vue')
const Setting = () => import('@/views/Setting.vue')
const ShaderPack = () => import('@/views/ShaderPack.vue')
const ShaderPackActions = () => import('@/views/ShaderPackActions.vue')
const ShaderPackExtension = () => import('@/views/ShaderPackExtension.vue')
const Store = () => import('@/views/Store.vue')
const StoreEntry = () => import('@/views/StoreEntry.vue')
const StoreProjectCurseforge = () => import('@/views/StoreProjectCurseforge.vue')
const StoreProjectFeedTheBeast = () => import('@/views/StoreProjectFeedTheBeast.vue')
const StoreProjectModrinth = () => import('@/views/StoreProjectModrinth.vue')

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      component: HomePageNew,
    },
    {
      path: '/new-home',
      component: HomePageNew,
    },
    {
      path: '/',
      component: HomeLayout,
      children: [
        {
          path: '',
          components: {
            default: Home,
            extensions: HomeExtension,
            actions: HomeActions,
          },
        },
        {
          path: 'save',
          components: {
            default: Save,
            extensions: SaveExtension,
            actions: SaveActions,
          },
        },
        {
          path: 'mods',
          components: {
            default: Mod,
            extensions: ModExtension,
            actions: ModActions,
          },
        },
        {
          path: 'resourcepacks',
          components: {
            default: ResourcePack,
            extensions: ResourcePackExtension,
            actions: ResourcePackActions,
          },
        },
        {
          path: 'shaderpacks',
          components: {
            default: ShaderPack,
            extensions: ShaderPackExtension,
            actions: ShaderPackActions,
          },
        },
        {
          path: 'base-setting',
          components: {
            default: BaseSetting,
            extensions: BaseSettingExtension,
            actions: BaseSettingActions,
          },
        },
      ],
    },
    {
      path: '/store',
      component: Store,
      children: [
        {
          path: '',
          component: StoreEntry,
        },
        {
          path: 'modrinth/:id',
          component: StoreProjectModrinth,
          props: (route) => ({ id: route.params.id }),
        },
        {
          path: 'curseforge/:id',
          component: StoreProjectCurseforge,
          props: (route) => ({ id: Number(route.params.id) }),
        },
        {
          path: 'ftb/:id',
          component: StoreProjectFeedTheBeast,
          props: (route) => ({ id: Number(route.params.id) }),
        },
      ],
    },
    {
      path: '/setting',
      component: Setting,
    },
    {
      path: '/me',
      component: Me,
    },
    {
      path: '/library',
      component: Library,
    },
    {
      path: '/skins',
      component: SkinLibrary,
    },
    {
      path: '/skins/edit/:id',
      component: SkinEditor,
    },
    {
      path: '/multiplayer',
      component: Multiplayer,
    },
    {
      path: '/servers',
      component: Servers,
    },
    {
      path: '/admin',
      component: AdminPanel,
    },
  ],
})
