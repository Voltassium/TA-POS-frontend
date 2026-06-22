<script setup lang="ts">
import { userApi, type CreateUserByAdminPayload, type UpdateUserPayload, type UserItem } from '@/api/userApi';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const authStore = useAuthStore();
const toast = useToast();

// ---- State ----
const users = ref<UserItem[]>([]);
const totalRecords = ref(0);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);

// Dialog tambah akun
const showCreateDialog = ref(false);
const createLoading = ref(false);
const createForm = ref<CreateUserByAdminPayload>({ email: '', password: '', role: 'staff' });

// Dialog edit akun
const showEditDialog = ref(false);
const editLoading = ref(false);
const editingUser = ref<UserItem | null>(null);
const editForm = ref<UpdateUserPayload & { password?: string }>({ email: '', password: '', role: '' });

// Dialog konfirmasi hapus
const showDeleteDialog = ref(false);
const deletingUser = ref<UserItem | null>(null);
const deleteLoading = ref(false);

// Role yang bisa dipilih saat mendaftarkan akun
const roleOptions = computed(() => {
    const base = [
        { label: 'Staff Kasir', value: 'staff' },
        { label: 'Chef / Koki', value: 'chef' }
    ];
    if (authStore.userRole === 'owner') {
        base.push({ label: 'Superadmin', value: 'superadmin' });
    }
    return base;
});

// Role options untuk edit (owner/superadmin bisa edit ke semua role kecuali superadmin)
const editRoleOptions = computed(() => {
    const base = [
        { label: 'Staff Kasir', value: 'staff' },
        { label: 'Chef / Koki', value: 'chef' }
    ];
    if (authStore.userRole === 'superadmin') {
        base.push({ label: 'Pemilik Toko (Owner)', value: 'owner' });
    }
    return base;
});

const roleLabel: Record<string, { label: string; severity: string }> = {
    superadmin: { label: 'Superadmin', severity: 'danger' },
    owner:      { label: 'Owner', severity: 'warn' },
    chef:       { label: 'Chef', severity: 'info' },
    staff:      { label: 'Staff', severity: 'secondary' }
};

// ---- Load data ----
async function loadUsers() {
    loading.value = true;
    try {
        const res = await userApi.list({ page: page.value, page_size: pageSize.value });
        users.value = res?.data ?? [];
        totalRecords.value = res?.meta?.total ?? 0;
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: e?.message ?? 'Gagal memuat daftar akun', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function onPageChange(event: { page: number; rows: number }) {
    page.value = event.page + 1;
    pageSize.value = event.rows;
    loadUsers();
}

// ---- Create ----
function openCreateDialog() {
    createForm.value = { email: '', password: '', role: 'staff' };
    showCreateDialog.value = true;
}

async function submitCreate() {
    if (!createForm.value.email || !createForm.value.password) {
        toast.add({ severity: 'warn', summary: 'Perhatian', detail: 'Email dan password wajib diisi', life: 3000 });
        return;
    }
    createLoading.value = true;
    try {
        await userApi.create(createForm.value);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Akun berhasil didaftarkan', life: 3000 });
        showCreateDialog.value = false;
        await loadUsers();
    } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? 'Gagal mendaftarkan akun';
        toast.add({ severity: 'error', summary: 'Gagal', detail: msg, life: 5000 });
    } finally {
        createLoading.value = false;
    }
}

// ---- Edit ----
function openEditDialog(user: UserItem) {
    editingUser.value = user;
    editForm.value = { email: user.email, password: '', role: user.role };
    showEditDialog.value = true;
}

async function submitEdit() {
    if (!editingUser.value) return;
    editLoading.value = true;
    try {
        const payload: UpdateUserPayload = { email: editForm.value.email, role: editForm.value.role };
        if (editForm.value.password) payload.password = editForm.value.password;
        await userApi.update(editingUser.value.id, payload);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Akun berhasil diperbarui', life: 3000 });
        showEditDialog.value = false;
        await loadUsers();
    } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? 'Gagal memperbarui akun';
        toast.add({ severity: 'error', summary: 'Gagal', detail: msg, life: 5000 });
    } finally {
        editLoading.value = false;
    }
}

// ---- Delete ----
function openDeleteDialog(user: UserItem) {
    deletingUser.value = user;
    showDeleteDialog.value = true;
}

async function confirmDelete() {
    if (!deletingUser.value) return;
    deleteLoading.value = true;
    try {
        await userApi.remove(deletingUser.value.id);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Akun berhasil dihapus', life: 3000 });
        showDeleteDialog.value = false;
        await loadUsers();
    } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? 'Gagal menghapus akun';
        toast.add({ severity: 'error', summary: 'Gagal', detail: msg, life: 5000 });
    } finally {
        deleteLoading.value = false;
    }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

onMounted(() => {
    loadUsers();
});
</script>

<template>
    <div class="flex flex-col gap-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-bold m-0">Manajemen Akun</h2>
                <p class="text-surface-500 mt-1 mb-0">Daftarkan dan kelola akun staff untuk toko Anda</p>
            </div>
            <Button
                id="btn-tambah-akun"
                label="Tambah Akun"
                icon="pi pi-plus"
                @click="openCreateDialog"
            />
        </div>

        <!-- Tabel -->
        <div class="card">
            <DataTable
                :value="users"
                :loading="loading"
                :rows="pageSize"
                :totalRecords="totalRecords"
                lazy
                paginator
                @page="onPageChange"
                :rowsPerPageOptions="[10, 25, 50]"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                currentPageReportTemplate="Menampilkan {first}-{last} dari {totalRecords} akun"
                stripedRows
                tableStyle="min-width: 50rem"
            >
                <template #empty>
                    <div class="text-center py-8 text-surface-400">
                        <i class="pi pi-users text-4xl mb-3 block"></i>
                        <p class="m-0">Belum ada akun yang terdaftar</p>
                    </div>
                </template>

                <Column field="email" header="Email" sortable>
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <Avatar :label="data.email[0].toUpperCase()" shape="circle" size="small"
                                class="bg-primary text-white font-bold" />
                            <span class="font-medium">{{ data.email }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="role" header="Role">
                    <template #body="{ data }">
                        <Tag
                            :value="roleLabel[data.role]?.label ?? data.role"
                            :severity="(roleLabel[data.role]?.severity as any) ?? 'secondary'"
                        />
                    </template>
                </Column>

                <Column field="created_at" header="Didaftarkan">
                    <template #body="{ data }">
                        <span class="text-surface-500 text-sm">{{ formatDate(data.created_at) }}</span>
                    </template>
                </Column>

                <Column header="Aksi" style="width: 130px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button
                                :id="`btn-edit-${data.id}`"
                                icon="pi pi-pencil"
                                rounded
                                text
                                severity="info"
                                size="small"
                                v-tooltip.top="'Edit Akun'"
                                @click="openEditDialog(data)"
                            />
                            <Button
                                :id="`btn-delete-${data.id}`"
                                icon="pi pi-trash"
                                rounded
                                text
                                severity="danger"
                                size="small"
                                v-tooltip.top="'Hapus Akun'"
                                @click="openDeleteDialog(data)"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- ======== Dialog: Tambah Akun ======== -->
        <Dialog
            v-model:visible="showCreateDialog"
            modal
            header="Daftarkan Akun Baru"
            :style="{ width: '480px' }"
            id="dialog-create-akun"
        >
            <div class="flex flex-col gap-4 pt-2">
                <div class="flex flex-col gap-1">
                    <label for="create-email" class="font-medium text-sm">Email <span class="text-red-500">*</span></label>
                    <InputText
                        id="create-email"
                        v-model="createForm.email"
                        placeholder="contoh@email.com"
                        type="email"
                        class="w-full"
                    />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="create-password" class="font-medium text-sm">Password <span class="text-red-500">*</span></label>
                    <Password
                        id="create-password"
                        v-model="createForm.password"
                        placeholder="Minimal 8 karakter"
                        :feedback="true"
                        toggleMask
                        class="w-full"
                        inputClass="w-full"
                    />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="create-role" class="font-medium text-sm">Role <span class="text-red-500">*</span></label>
                    <Select
                        id="create-role"
                        v-model="createForm.role"
                        :options="roleOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Pilih role"
                        class="w-full"
                    />
                </div>

                <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex gap-2 items-start">
                        <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                        <p class="text-sm text-blue-700 dark:text-blue-300 m-0">
                            Akun yang didaftarkan akan otomatis terhubung ke toko Anda.
                        </p>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Batal" severity="secondary" text @click="showCreateDialog = false" />
                    <Button
                        id="btn-submit-create"
                        label="Daftarkan Akun"
                        icon="pi pi-check"
                        :loading="createLoading"
                        @click="submitCreate"
                    />
                </div>
            </template>
        </Dialog>

        <!-- ======== Dialog: Edit Akun ======== -->
        <Dialog
            v-model:visible="showEditDialog"
            modal
            header="Edit Akun"
            :style="{ width: '480px' }"
            id="dialog-edit-akun"
        >
            <div class="flex flex-col gap-4 pt-2" v-if="editingUser">
                <div class="flex flex-col gap-1">
                    <label for="edit-email" class="font-medium text-sm">Email</label>
                    <InputText
                        id="edit-email"
                        v-model="editForm.email"
                        placeholder="contoh@email.com"
                        type="email"
                        class="w-full"
                    />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="edit-password" class="font-medium text-sm">
                        Password Baru
                        <span class="text-surface-400 font-normal text-xs">(kosongkan jika tidak ingin mengubah)</span>
                    </label>
                    <Password
                        id="edit-password"
                        v-model="editForm.password"
                        placeholder="Password baru..."
                        :feedback="false"
                        toggleMask
                        class="w-full"
                        inputClass="w-full"
                    />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="edit-role" class="font-medium text-sm">Role</label>
                    <Select
                        id="edit-role"
                        v-model="editForm.role"
                        :options="editRoleOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Pilih role"
                        class="w-full"
                    />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Batal" severity="secondary" text @click="showEditDialog = false" />
                    <Button
                        id="btn-submit-edit"
                        label="Simpan Perubahan"
                        icon="pi pi-check"
                        :loading="editLoading"
                        @click="submitEdit"
                    />
                </div>
            </template>
        </Dialog>

        <!-- ======== Dialog: Konfirmasi Hapus ======== -->
        <Dialog
            v-model:visible="showDeleteDialog"
            modal
            header="Konfirmasi Hapus"
            :style="{ width: '420px' }"
            id="dialog-delete-akun"
        >
            <div class="flex items-center gap-4 pt-2" v-if="deletingUser">
                <div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 shrink-0">
                    <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
                </div>
                <div>
                    <p class="m-0 font-semibold">Hapus akun ini?</p>
                    <p class="m-0 mt-1 text-surface-500 text-sm">
                        Akun <strong>{{ deletingUser.email }}</strong> akan dihapus secara permanen dan tidak dapat dipulihkan.
                    </p>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Batal" severity="secondary" text @click="showDeleteDialog = false" />
                    <Button
                        id="btn-confirm-delete"
                        label="Ya, Hapus"
                        icon="pi pi-trash"
                        severity="danger"
                        :loading="deleteLoading"
                        @click="confirmDelete"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>
