<template>
  <div class="admin-panel px-6 py-6 overflow-y-auto h-full">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <v-icon size="22" color="red">admin_panel_settings</v-icon>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">Admin Panel</h1>
            <p class="text-white/30 text-xs">Manage your launcher</p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs text-white/30">
          <v-icon size="12">update</v-icon>
          <span>Live</span>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="admin-stat-card">
          <div class="flex items-center justify-between mb-2">
            <div class="admin-stat-icon" style="background: rgba(34,197,94,0.15);">
              <v-icon size="16" color="#22c55e">people</v-icon>
            </div>
            <span v-if="onlineLoading" class="text-white/20">
              <v-icon size="12">sync</v-icon>
            </span>
            <span v-else class="w-2 h-2 rounded-full" :class="onlineCount > 0 ? 'bg-green-400' : 'bg-gray-500'" />
          </div>
          <div class="admin-stat-value">{{ onlineCount }}</div>
          <div class="admin-stat-label">Online Now</div>
        </div>
        <div class="admin-stat-card">
          <div class="flex items-center justify-between mb-2">
            <div class="admin-stat-icon" style="background: rgba(99,102,241,0.15);">
              <v-icon size="16" color="#6366f1">inventory_2</v-icon>
            </div>
          </div>
          <div class="admin-stat-value">{{ instances.length }}</div>
          <div class="admin-stat-label">Instances</div>
        </div>
        <div class="admin-stat-card">
          <div class="flex items-center justify-between mb-2">
            <div class="admin-stat-icon" style="background: rgba(250,204,21,0.15);">
              <v-icon size="16" color="#facc15">schedule</v-icon>
            </div>
          </div>
          <div class="admin-stat-value">{{ totalPlaytime }}</div>
          <div class="admin-stat-label">Playtime</div>
        </div>
        <div class="admin-stat-card">
          <div class="flex items-center justify-between mb-2">
            <div class="admin-stat-icon" style="background: rgba(56,189,248,0.15);">
              <v-icon size="16" color="#38bdf8">update</v-icon>
            </div>
          </div>
          <div class="admin-stat-value">{{ recentCount }}</div>
          <div class="admin-stat-label">Played This Week</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <!-- Online Players -->
        <div class="admin-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <v-icon size="16" color="#22c55e">people</v-icon>
              Online Players
            </h2>
            <span class="text-xs text-white/30">{{ onlineCount }} online</span>
          </div>
          <div v-if="onlinePlayers.length === 0 && !onlineLoading" class="flex flex-col items-center justify-center py-8 text-white/20">
            <v-icon size="32" class="mb-2">person_off</v-icon>
            <span class="text-xs">No players online</span>
          </div>
          <div v-if="onlineLoading" class="flex items-center justify-center py-8 text-white/20">
            <v-icon size="24" class="animate-spin">sync</v-icon>
          </div>
          <div v-else class="space-y-1 max-h-[300px] overflow-y-auto pr-1">
            <div
              v-for="p in onlinePlayers"
              :key="p.id"
              class="online-player-row"
            >
              <div class="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <v-icon size="12" color="#22c55e">person</v-icon>
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-white truncate block">{{ p.username }}</span>
                <span class="text-[10px] text-white/30">{{ fmtRelative(p.lastSeen) }}</span>
              </div>
              <span class="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            </div>
          </div>
        </div>

        <!-- Most Played -->
        <div class="admin-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <v-icon size="16" color="#facc15">emoji_events</v-icon>
              Most Played
            </h2>
            <span class="text-xs text-white/30">top 8</span>
          </div>
          <div v-if="topInstances.length === 0" class="flex flex-col items-center justify-center py-8 text-white/20">
            <v-icon size="32" class="mb-2">inventory_2</v-icon>
            <span class="text-xs">No instances yet</span>
          </div>
          <div v-else class="space-y-1">
            <div v-for="(inst, i) in topInstances" :key="inst.path" class="top-instance-row">
              <span class="text-white/20 text-xs font-mono w-4 flex-shrink-0 text-right">{{ i + 1 }}</span>
              <div class="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                <v-img :src="getInstanceIcon(inst, undefined)" :width="28" :height="28" />
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-white truncate block">{{ inst.name || 'Unknown' }}</span>
                <div class="flex items-center gap-2">
                  <div class="playtime-bar-bg">
                    <div class="playtime-bar-fill" :style="{ width: playtimeBarWidth(inst.playtime || 0) }" />
                  </div>
                  <span class="text-[10px] text-white/30 w-8 text-right">{{ formatPlaytime(inst.playtime || 0) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="admin-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <v-icon size="16" color="#38bdf8">bolt</v-icon>
              Quick Actions
            </h2>
          </div>
          <div class="space-y-2">
            <button class="quick-action-btn" @click="refreshNow">
              <v-icon size="14" color="#6366f1">refresh</v-icon>
              <span>Refresh All Data</span>
            </button>
            <button class="quick-action-btn" @click="notifTitle = ''; notifMessage = ''">
              <v-icon size="14" color="#22c55e">notifications</v-icon>
              <span>Clear Notification Form</span>
            </button>
            <button class="quick-action-btn" @click="serverForm.name = ''; serverForm.host = ''; serverForm.port = 25565">
              <v-icon size="14" color="#facc15">dns</v-icon>
              <span>Reset Server Form</span>
            </button>
            <button class="quick-action-btn" @click="newsForm.title = ''; newsForm.description = ''; newsForm.imageUrl = ''; newsForm.tag = 'NEWS'">
              <v-icon size="14" color="#f97316">newspaper</v-icon>
              <span>Reset News Form</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Monitor -->
      <div class="admin-card mb-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <v-icon size="16" color="#22c55e">forum</v-icon>
            Chat Monitor
            <v-badge v-if="allChats.length" inline :content="allChats.length" color="primary" class="ml-1" />
          </h2>
        </div>

        <div v-if="allChats.length === 0" class="flex flex-col items-center justify-center py-8 text-white/20">
          <v-icon size="32" class="mb-2">forum</v-icon>
          <span class="text-xs">No conversations yet</span>
        </div>

        <div v-else class="flex gap-4 h-[360px]">
          <div class="w-56 flex-shrink-0 overflow-y-auto space-y-1 border-r pr-2" style="border-color: rgba(255,255,255,0.06);">
            <div
              v-for="c in allChats"
              :key="c.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm"
              :class="selectedAdminChat === c.id ? 'bg-primary/20' : 'hover:bg-white/5'"
              @click="selectAdminChat(c.id)"
            >
              <div class="flex flex-col min-w-0 flex-1">
                <span class="font-medium truncate text-white">{{ c.displayNames.join(' vs ') }}</span>
                <span class="text-[11px] text-white/40 truncate">{{ c.lastMessage || 'No messages' }}</span>
              </div>
              <span v-if="c.lastMessageAt" class="text-[10px] text-white/30 flex-shrink-0">{{ fmtTime(c.lastMessageAt) }}</span>
            </div>
          </div>

          <div v-if="selectedAdminChat" class="flex-1 flex flex-col min-w-0">
            <div class="flex items-center gap-2 mb-2 pb-2 border-b text-xs text-white/50" style="border-color: rgba(255,255,255,0.06);">
              <v-icon size="14">forum</v-icon>
              <span>{{ adminChatTitle }}</span>
              <span class="text-white/20">· {{ adminMessages.length }} messages</span>
            </div>
            <div ref="adminChatScroll" class="flex-1 overflow-y-auto space-y-2 pr-2 mb-3">
              <div v-for="m in adminMessages" :key="m.id" class="flex flex-col" :class="m.fromProfileId === myProfileId ? 'items-end' : 'items-start'">
                <div class="flex items-center gap-1 mb-0.5">
                  <span class="text-[10px] text-white/30">{{ m.fromProfileId }}</span>
                  <span v-if="m.fromProfileId === myProfileId" class="text-[10px] text-primary font-semibold">(Owner)</span>
                </div>
                <div class="max-w-[80%] px-3 py-2 rounded-2xl text-sm" :class="m.fromProfileId === myProfileId ? 'bg-primary text-white rounded-br-md' : 'bg-white/10 rounded-bl-md'">
                  {{ m.text }}
                  <div class="text-[10px] mt-0.5 opacity-50">{{ fmtTime(m.createdAt) }}</div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <v-select
                v-model="adminChatAsUser"
                :items="adminChatUsers"
                density="compact"
                variant="outlined"
                hide-details
                class="flex-shrink-0"
                style="max-width: 130px;"
                label="Send as"
              />
              <v-text-field
                v-model="adminChatInput"
                density="compact"
                variant="outlined"
                rounded="xl"
                hide-details
                placeholder="Type as owner..."
                class="flex-1"
                @keydown.enter="onAdminSend"
              />
              <v-btn icon color="green" variant="flat" rounded="lg" size="small" :disabled="!adminChatInput.trim()" @click="onAdminSend">
                <v-icon>send</v-icon>
              </v-btn>
            </div>
          </div>
          <div v-else class="flex-1 flex items-center justify-center text-white/20 text-xs">
            Select a conversation
          </div>
        </div>
      </div>

      <!-- Notification + News + Tags -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <!-- Send Notification -->
        <div class="admin-card">
          <h2 class="text-base font-bold text-white mb-4 flex items-center gap-2">
            <v-icon size="16" color="#38bdf8">notifications</v-icon>
            Send Notification
          </h2>
          <v-text-field v-model="notifTitle" label="Title" variant="outlined" density="compact" class="mb-2" hide-details />
          <v-textarea v-model="notifMessage" label="Message" variant="outlined" density="compact" class="mb-3" hide-details rows="2" />
          <div class="flex gap-2">
            <v-btn color="blue" variant="flat" size="small" @click="sendNotification" :disabled="!notifTitle || !notifMessage">
              <v-icon start size="14">send</v-icon> Send
            </v-btn>
            <v-btn v-if="adminData.notification.value.active" color="red" variant="text" size="small" @click="dismissNotif">
              <v-icon start size="14">close</v-icon> Dismiss
            </v-btn>
          </div>
          <div v-if="adminData.notification.value.active" class="mt-3 bg-blue-500/10 rounded-lg px-3 py-2 text-xs text-blue-400">
            Active: "{{ adminData.notification.value.title }}"
            <br>
            <span class="text-blue-300/60">{{ formatDate(adminData.notification.value.date) }}</span>
          </div>
          <div v-else class="mt-3 text-xs text-white/20 italic">
            No active notification
          </div>

          <!-- Notification History -->
          <div class="mt-4 pt-3 border-t" style="border-color: rgba(255,255,255,0.06);">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-white/50 uppercase tracking-wider">History</span>
              <span class="text-[10px] text-white/30">{{ adminData.notificationHistory.value.length }} past</span>
            </div>
            <div v-if="adminData.notificationHistory.value.length === 0" class="text-xs text-white/20 italic">
              No past notifications
            </div>
            <div v-else class="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              <div
                v-for="n in adminData.notificationHistory.value"
                :key="n.id"
                class="flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5"
                :class="{ 'opacity-40': !n.active }"
              >
                <div class="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" :class="n.active ? 'bg-blue-400' : 'bg-white/20'" />
                <div class="flex-1 min-w-0">
                  <div class="text-white/80 font-medium truncate">{{ n.title }}</div>
                  <div class="text-white/30 truncate">{{ n.message }}</div>
                  <div class="text-[10px] text-white/20 mt-0.5">{{ formatDate(n.date) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- News Manager -->
        <div class="admin-card">
          <h2 class="text-base font-bold text-white mb-4 flex items-center gap-2">
            <v-icon size="16" color="#f97316">newspaper</v-icon>
            News Manager
            <span class="text-xs text-white/30 ml-auto">{{ adminData.newsList.value.length }} items</span>
          </h2>
          <div class="grid grid-cols-1 gap-2 mb-2">
            <v-text-field v-model="newsForm.title" label="Title" variant="outlined" density="compact" hide-details />
            <div class="grid grid-cols-2 gap-2">
              <v-text-field v-model="newsForm.imageUrl" label="Image URL" variant="outlined" density="compact" hide-details />
              <v-select v-model="newsForm.tag" :items="tagOptions" label="Tag" variant="outlined" density="compact" hide-details />
            </div>
          </div>
          <v-textarea v-model="newsForm.description" label="Description" variant="outlined" density="compact" class="mb-3" hide-details rows="1" />
          <div class="flex gap-2 mb-3">
            <v-btn color="orange" variant="flat" size="small" @click="newsEditId ? updateNewsItem() : addNewsItem()" :disabled="!newsForm.title">
              <v-icon start size="14">{{ newsEditId ? 'save' : 'add' }}</v-icon> {{ newsEditId ? 'Update' : 'Add News' }}
            </v-btn>
            <v-btn v-if="newsEditId" color="white" variant="text" size="small" @click="cancelNewsEdit">
              Cancel
            </v-btn>
          </div>
          <div v-if="adminData.newsList.value.length > 0" class="space-y-1 max-h-[200px] overflow-y-auto">
            <div v-for="item in sortedNews" :key="item.id" class="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <img v-if="item.imageUrl" :src="item.imageUrl" class="w-10 h-7 rounded object-cover flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="news-tag text-[10px] font-semibold" :style="tagStyle(item.tag)">{{ item.tag }}</span>
                  <span class="text-white text-xs font-medium truncate">{{ item.title }}</span>
                </div>
                <span class="text-[10px] text-white/20">{{ formatDate(item.date) }}</span>
              </div>
              <v-btn icon variant="text" size="x-small" color="white" @click="editNewsItem(item)">
                <v-icon size="14">edit</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="x-small" color="red" @click="confirmDeleteNews(item)">
                <v-icon size="14">delete</v-icon>
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Tag Manager -->
        <div class="admin-card">
          <h2 class="text-base font-bold text-white mb-4 flex items-center gap-2">
            <v-icon size="16" color="#a855f7">local_offer</v-icon>
            Tag Manager
            <span class="text-xs text-white/30 ml-auto">{{ adminData.tagsList.value.length }} tags</span>
          </h2>

          <!-- Add Tag -->
          <div class="flex gap-2 mb-3">
            <v-text-field v-model="tagForm.name" label="Tag name" variant="outlined" density="compact" hide-details class="flex-1" />
            <input
              v-model="tagForm.color"
              type="color"
              class="h-[36px] w-[36px] rounded-lg border-0 cursor-pointer bg-transparent flex-shrink-0"
              title="Tag color"
            />
            <v-btn color="purple" variant="flat" size="small" @click="addTagItem" :disabled="!tagForm.name">
              <v-icon size="14">add</v-icon>
            </v-btn>
          </div>

          <!-- Tag List -->
          <div v-if="adminData.tagsList.value.length === 0" class="text-xs text-white/20 italic">
            No tags yet. Add one above.
          </div>
          <div v-else class="space-y-1 max-h-[200px] overflow-y-auto">
            <div
              v-for="tag in adminData.tagsList.value"
              :key="tag.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5"
            >
              <div class="w-4 h-4 rounded flex-shrink-0" :style="{ backgroundColor: tag.color }" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-white text-xs font-medium">{{ tag.name }}</span>
                  <span class="text-[10px] text-white/30 font-mono">{{ tag.title || '—' }}</span>
                </div>
              </div>
              <v-btn icon variant="text" size="x-small" color="red" @click="confirmDeleteTag(tag.id)">
                <v-icon size="14">delete</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- Admin Users -->
      <div v-if="isOwner" class="admin-card mb-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <v-icon size="16" color="#a855f7">shield</v-icon>
            Admin Users
            <span class="text-xs text-white/30 ml-auto">{{ adminUsers.length }} users</span>
          </h2>
        </div>

        <!-- Add Admin -->
        <div class="flex gap-2 mb-3">
          <v-text-field
            v-model="adminUserForm.name"
            label="Minecraft username"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-1"
            :error-messages="adminUserError"
            @keydown.enter="addAdminUser"
          />
          <v-select
            v-model="adminUserForm.permission"
            :items="[
              { title: '👁 View only', value: 'view' },
              { title: '✏️ Can edit', value: 'edit' },
              { title: '👑 Owner', value: 'owner' },
            ]"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-shrink-0"
            style="max-width: 150px;"
          />
          <v-btn color="purple" variant="flat" size="small" @click="addAdminUser" :disabled="!adminUserForm.name">
            <v-icon size="14">add_moderator</v-icon>
          </v-btn>
        </div>

        <!-- Admin List -->
        <div v-if="adminUsers.length === 0" class="text-xs text-white/20 italic">
          No admin users yet. Add one above.
        </div>
        <div v-else class="space-y-1 max-h-[300px] overflow-y-auto">
          <div
            v-for="u in sortedAdminUsers"
            :key="u.id"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              :class="u.permission === 'owner' ? 'bg-purple-500/20 text-purple-400' : u.permission === 'edit' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'"
            >
              {{ u.name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-white">{{ u.name }}</span>
                <span class="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  :class="u.permission === 'owner' ? 'bg-purple-500/15 text-purple-400' : u.permission === 'edit' ? 'bg-blue-500/15 text-blue-400' : 'bg-green-500/15 text-green-400'"
                >
                  {{ u.permission }}
                </span>
                <span v-if="u.name === myProfileId" class="text-[10px] text-white/30">(you)</span>
              </div>
              <div class="text-[10px] text-white/30">
                Added {{ fmtRelative(u.addedAt) }} by {{ u.addedBy }}
              </div>
            </div>

            <!-- Change permission (only for non-owner users, or owner can't demote self) -->
            <v-select
              v-if="u.permission !== 'owner' || u.name !== myProfileId"
              :model-value="u.permission"
              :items="[
                { title: '👁 view', value: 'view' },
                { title: '✏️ edit', value: 'edit' },
              ]"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-shrink-0"
              style="max-width: 100px;"
              @update:model-value="(val) => changeAdminPerm(u.name, val)"
            />

            <v-btn
              v-if="u.name !== myProfileId"
              icon variant="text" size="x-small" color="red"
              @click="confirmDeleteAdminUser(u)"
            >
              <v-icon size="14">remove_moderator</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Server Manager -->
      <div class="admin-card mb-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <v-icon size="16" color="#22c55e">dns</v-icon>
            Server Manager
            <span class="text-xs text-white/30">{{ servers.length }} servers</span>
          </h2>
          <v-btn v-if="serverStatusLoading" size="x-small" variant="text" color="green" loading disabled>
            Pinging…
          </v-btn>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <v-text-field v-model="serverForm.name" label="Server Name" variant="outlined" density="compact" hide-details />
          <v-text-field v-model="serverForm.host" label="IP Address" variant="outlined" density="compact" hide-details />
          <v-text-field v-model.number="serverForm.port" label="Port" variant="outlined" density="compact" hide-details type="number" />
        </div>
        <div class="flex gap-2 mb-4">
          <v-btn color="green" variant="flat" size="small" @click="serverEditId ? updateServerItem() : addServerItem()" :disabled="!serverForm.name || !serverForm.host">
            <v-icon start size="14">{{ serverEditId ? 'save' : 'add' }}</v-icon> {{ serverEditId ? 'Update' : 'Add Server' }}
          </v-btn>
          <v-btn v-if="serverEditId" color="white" variant="text" size="small" @click="cancelServerEdit">
            Cancel
          </v-btn>
        </div>
        <div v-if="servers.length > 0" class="space-y-1">
          <div v-for="srv in servers" :key="srv.id" class="server-row">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="serverStatuses[srv.id]?.online ? 'bg-green-500/20' : 'bg-red-500/10'">
              <v-icon size="16" :color="serverStatuses[srv.id]?.online ? '#22c55e' : '#ef4444'">dns</v-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-white">{{ srv.name }}</span>
                <span class="text-[11px] text-white/40 font-mono">{{ srv.host }}:{{ srv.port }}</span>
              </div>
              <div class="flex items-center gap-2 text-[11px]">
                <span class="w-1.5 h-1.5 rounded-full" :class="serverStatuses[srv.id]?.online ? 'bg-green-400' : 'bg-red-400/50'"></span>
                <span v-if="serverStatuses[srv.id]" class="text-white/40">
                  {{ serverStatuses[srv.id].online ? serverStatuses[srv.id].players + ' players' : 'offline' }}
                  <template v-if="serverStatuses[srv.id].ping"> · {{ serverStatuses[srv.id].ping }}ms</template>
                </span>
                <span v-else class="text-white/20">pinging…</span>
              </div>
            </div>
            <v-btn icon variant="text" size="x-small" color="white" @click="editServerItem(srv)">
              <v-icon size="14">edit</v-icon>
            </v-btn>
            <v-btn icon variant="text" size="x-small" color="red" @click="confirmDeleteServer(srv)">
              <v-icon size="14">delete</v-icon>
            </v-btn>
            <v-btn icon variant="text" size="x-small" color="green" @click="refreshServerStatus(srv.host, srv.port, srv.id)">
              <v-icon size="12">refresh</v-icon>
            </v-btn>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-6 text-white/20">
          <v-icon size="28" class="mb-2">dns</v-icon>
          <span class="text-xs">No servers added yet</span>
        </div>
      </div>
    </div>

    <!-- Permission info banner for view-only admins -->
    <div v-if="isAdmin && !canEdit" class="admin-card mb-5">
      <div class="flex flex-col items-center gap-3 py-4">
        <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
          <v-icon size="20" color="#3b82f6">visibility</v-icon>
        </div>
        <div>
          <div class="text-sm font-medium text-white">View-Only Mode</div>
          <div class="text-xs text-white/40 mt-1">You can view stats and chat, but cannot make changes.</div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDialog" max-width="360">
      <div class="bg-[#1e1e2e] rounded-2xl p-5 border" style="border-color: rgba(255,255,255,0.08);">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <v-icon size="16" color="#ef4444">warning_amber</v-icon>
          </div>
          <div>
            <div class="text-sm font-medium text-white">Confirm</div>
            <div class="text-xs text-white/50">{{ confirmMessage }}</div>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <v-btn variant="text" size="small" @click="onConfirm(false)">Cancel</v-btn>
          <v-btn color="red" variant="flat" size="small" @click="onConfirm(true)">Delete</v-btn>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, onUnmounted, watch, nextTick } from 'vue'
import { injection } from '@/util/inject'
import { kInstances } from '@/composables/instances'
import { kLimyrxFriends } from '@/composables/limyrxFriends'
import { kUserContext } from '@/composables/user'
import { useOnlinePlayers } from '@/composables/onlinePlayers'
import { useAdminData } from '@/composables/adminData'
import { useAdminPermissions, type AdminPermission, type AdminUser } from '@/composables/adminPermissions'
import { getInstanceIcon } from '@/util/favicon'
import type { Instance } from '@xmcl/instance'

const { instances } = injection(kInstances)
const { playerCount: onlineCount, players: onlinePlayers, loading: onlineLoading } = useOnlinePlayers()
const adminData = useAdminData()

const { gameProfile } = injection(kUserContext)
const myProfileId = computed(() => gameProfile.value?.name || 'owner')

// Admin permissions
const {
  isAdmin,
  canEdit,
  isOwner,
  adminUsers,
  setCurrentUser,
  addAdmin,
  removeAdmin,
  updatePermission,
} = useAdminPermissions()

watch(() => gameProfile.value?.name, (name) => {
  if (name) setCurrentUser(name)
}, { immediate: true })
const { allChats, getAllMessages, profiles, adminSendAsUser } = injection(kLimyrxFriends)
const selectedAdminChat = ref('')
const adminChatInput = ref('')
const adminChatAsUser = ref('')
const adminChatScroll = ref<HTMLDivElement | null>(null)

const adminMessages = computed(() => {
  if (!selectedAdminChat.value) return []
  return getAllMessages(selectedAdminChat.value).slice(-100)
})

const adminChatUsers = computed(() => {
  if (!selectedAdminChat.value) return []
  const chat = allChats.value.find(c => c.id === selectedAdminChat.value)
  if (!chat) return []
  return chat.participants
})

const adminChatTitle = computed(() => {
  if (!selectedAdminChat.value) return ''
  const chat = allChats.value.find(c => c.id === selectedAdminChat.value)
  if (!chat) return ''
  return chat.displayNames.join(' vs ')
})

function selectAdminChat(id: string) {
  selectedAdminChat.value = id
  adminChatAsUser.value = adminChatUsers.value[0] || myProfileId.value
  nextTick(() => {
    if (adminChatScroll.value) {
      adminChatScroll.value.scrollTop = adminChatScroll.value.scrollHeight
    }
  })
}

function onAdminSend() {
  if (!selectedAdminChat.value || !adminChatInput.value.trim()) return
  adminSendAsUser(selectedAdminChat.value, adminChatInput.value, adminChatAsUser.value || myProfileId.value)
  adminChatInput.value = ''
  nextTick(() => {
    if (adminChatScroll.value) {
      adminChatScroll.value.scrollTop = adminChatScroll.value.scrollHeight
    }
  })
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function fmtRelative(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

// --- Notification ---
const notifTitle = ref('')
const notifMessage = ref('')

async function sendNotification() {
  await adminData.saveNotification({
    title: notifTitle.value,
    message: notifMessage.value,
    active: true,
  })
  notifTitle.value = ''
  notifMessage.value = ''
}

async function dismissNotif() {
  await adminData.dismissNotification()
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 3600000) return 'just now'
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

// --- Servers ---
const serverForm = reactive({
  name: '',
  host: '',
  port: 25565,
})
const serverEditId = ref('')
const serverStatusLoading = ref(false)

const servers = computed(() => adminData.serversList.value || [])

// Live server status
interface ServerLiveStatus { online: boolean; players: string; ping?: number }
const serverStatuses = ref<Record<string, ServerLiveStatus>>({})
const statusTimers = ref<Record<string, ReturnType<typeof setInterval>>>({})

async function fetchServerStatus(host: string, port: number | undefined, id: string) {
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${host}${port && port !== 25565 ? ':' + port : ''}`)
    const data = await res.json()
    if (data?.online) {
      serverStatuses.value[id] = {
        online: true,
        players: `${data.players?.online ?? 0}/${data.players?.max ?? 0}`,
        ping: data.debug?.ping ?? undefined,
      }
    } else {
      serverStatuses.value[id] = { online: false, players: '0/0' }
    }
  } catch {
    serverStatuses.value[id] = { online: false, players: '0/0' }
  }
}

function refreshServerStatus(host: string, port: number | undefined, id: string) {
  serverStatusLoading.value = true
  fetchServerStatus(host, port, id).finally(() => { serverStatusLoading.value = false })
}

function startStatusPolling() {
  const list = adminData.serversList.value || []
  list.forEach(s => {
    const id = s.id
    if (statusTimers.value[id]) return
    fetchServerStatus(s.host, s.port, id)
    statusTimers.value[id] = setInterval(() => fetchServerStatus(s.host, s.port, id), 120000)
  })
}

onUnmounted(() => {
  Object.values(statusTimers.value).forEach(t => clearInterval(t))
})

watch(() => adminData.serversList.value?.length, () => {
  startStatusPolling()
}, { immediate: true })

function editServerItem(srv: any) {
  serverEditId.value = srv.id
  serverForm.name = srv.name
  serverForm.host = srv.host
  serverForm.port = srv.port || 25565
}

function cancelServerEdit() {
  serverEditId.value = ''
  serverForm.name = ''
  serverForm.host = ''
  serverForm.port = 25565
}

async function updateServerItem() {
  await adminData.updateServer({
    id: serverEditId.value,
    name: serverForm.name,
    host: serverForm.host,
    port: serverForm.port || 25565,
  })
  cancelServerEdit()
}

async function addServerItem() {
  await adminData.addServer({
    name: serverForm.name,
    host: serverForm.host,
    port: serverForm.port || 25565,
  })
  serverForm.name = ''
  serverForm.host = ''
  serverForm.port = 25565
}

async function removeServerItem(id: string) {
  await adminData.removeServer(id)
}

async function confirmDeleteServer(srv: any) {
  const confirmed = await showConfirm(`Delete server "${srv.name}"?`)
  if (confirmed) {
    await adminData.removeServer(srv.id)
  }
}

// --- News ---
const newsForm = reactive({
  title: '',
  description: '',
  imageUrl: '',
  tag: 'NEWS',
})
const newsEditId = ref('')

const tagOptions = computed(() => {
  return adminData.tagsList.value.map((t: any) => t.name)
})

// --- Tags ---
const tagForm = reactive({
  name: '',
  color: '#6366f1',
})

async function addTagItem() {
  await adminData.addTag({
    name: tagForm.name.toUpperCase(),
    color: tagForm.color,
    title: tagForm.name,
  })
  tagForm.name = ''
  tagForm.color = '#6366f1'
}

async function confirmDeleteTag(id: string) {
  const confirmed = await showConfirm('Delete this tag?')
  if (confirmed) {
    await adminData.removeTag(id)
  }
}

// --- Admin Users ---
const adminUserForm = reactive({
  name: '',
  permission: 'view' as AdminPermission,
})
const adminUserError = ref('')

const sortedAdminUsers = computed(() => {
  const order = { owner: 0, edit: 1, view: 2 }
  return [...adminUsers.value].sort((a, b) => (order[a.permission] ?? 99) - (order[b.permission] ?? 99))
})

async function addAdminUser() {
  adminUserError.value = ''
  const err = await addAdmin(adminUserForm.name, adminUserForm.permission)
  if (err) {
    adminUserError.value = err
  } else {
    adminUserForm.name = ''
    adminUserForm.permission = 'view'
  }
}

async function confirmDeleteAdminUser(u: AdminUser) {
  const confirmed = await showConfirm(`Remove admin "${u.name}"?`)
  if (confirmed) {
    const err = await removeAdmin(u.name)
    if (err) adminUserError.value = err
  }
}

async function changeAdminPerm(name: string, permission: AdminPermission) {
  const err = await updatePermission(name, permission)
  if (err) adminUserError.value = err
}

function editNewsItem(item: any) {
  newsEditId.value = item.id
  newsForm.title = item.title
  newsForm.description = item.description || ''
  newsForm.imageUrl = item.imageUrl || ''
  newsForm.tag = item.tag || 'NEWS'
}

function cancelNewsEdit() {
  newsEditId.value = ''
  newsForm.title = ''
  newsForm.description = ''
  newsForm.imageUrl = ''
  newsForm.tag = 'NEWS'
}

async function updateNewsItem() {
  await adminData.updateNews({
    id: newsEditId.value,
    title: newsForm.title,
    description: newsForm.description,
    imageUrl: newsForm.imageUrl,
    date: new Date().toISOString(),
    tag: newsForm.tag,
  })
  cancelNewsEdit()
}

async function addNewsItem() {
  await adminData.addNews({
    title: newsForm.title,
    description: newsForm.description,
    imageUrl: newsForm.imageUrl,
    date: new Date().toISOString(),
    tag: newsForm.tag,
  })
  newsForm.title = ''
  newsForm.description = ''
  newsForm.imageUrl = ''
  newsForm.tag = 'NEWS'
}

async function removeNewsItem(id: string) {
  await adminData.removeNews(id)
}

async function confirmDeleteNews(item: any) {
  const confirmed = await showConfirm(`Delete news "${item.title}"?`)
  if (confirmed) {
    await adminData.removeNews(item.id)
  }
}

const sortedNews = computed(() => {
  return [...(adminData.newsList.value || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

function tagStyle(tagName: string) {
  const found = adminData.tagsList.value.find((t: any) => t.name === tagName)
  if (found) {
    return { color: found.color, background: found.color + '20' }
  }
  return {}
}

// --- Stats ---
const recentCount = computed(() => {
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000
  return instances.value.filter(i => (i.lastAccessDate || 0) > week).length
})

const totalPlaytime = computed(() => {
  const total = instances.value.reduce((acc, i) => acc + (i.playtime || 0), 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
})

const topInstances = computed(() => {
  return [...instances.value].sort((a, b) => (b.playtime || 0) - (a.playtime || 0)).slice(0, 8)
})

const maxPlaytime = computed(() => Math.max(...topInstances.value.map(i => i.playtime || 0), 1))

function playtimeBarWidth(playtime: number): string {
  const pct = (playtime / maxPlaytime.value) * 100
  return `${Math.max(pct, 4)}%`
}

function formatPlaytime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h` : `${m}m`
}

// --- Confirmation Dialog ---
const confirmDialog = ref(false)
const confirmMessage = ref('')
let confirmResolve: ((val: boolean) => void) | null = null

function showConfirm(msg: string): Promise<boolean> {
  confirmMessage.value = msg
  confirmDialog.value = true
  return new Promise(resolve => {
    confirmResolve = resolve
  })
}

function onConfirm(ok: boolean) {
  confirmDialog.value = false
  confirmResolve?.(ok)
  confirmResolve = null
}

function refreshNow() {
  refreshAll()
}

// Refresh all servers
function refreshAll() {
  const list = adminData.serversList.value || []
  list.forEach(s => fetchServerStatus(s.host, s.port, s.id))
}
</script>

<style scoped>
.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Admin cards */
.admin-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 18px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Stat cards */
.admin-stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px 16px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.admin-stat-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-stat-value {
  font-size: 26px;
  font-weight: 700;
  color: white;
  line-height: 1.1;
}

.admin-stat-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-top: 2px;
}

/* Online players */
.online-player-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 10px;
  transition: background 0.15s ease;
}
.online-player-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

/* Top instances */
.top-instance-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.top-instance-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

/* Server rows */
.server-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  transition: background 0.15s ease;
}
.server-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

/* Playtime bars */
.playtime-bar-bg {
  width: 56px;
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: hidden;
}
.playtime-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(var(--v-theme-primary), 0.5), rgba(var(--v-theme-primary), 0.85));
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Quick actions */
.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}
.quick-action-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  color: white;
}

/* News tags */
.news-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Custom scrollbars */
.max-h-\[300px\]::-webkit-scrollbar,
.max-h-\[200px\]::-webkit-scrollbar {
  width: 4px;
}
.max-h-\[300px\]::-webkit-scrollbar-thumb,
.max-h-\[200px\]::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
}
</style>