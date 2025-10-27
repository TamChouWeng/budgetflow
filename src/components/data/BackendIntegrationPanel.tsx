import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apiBaseUrl,
  createInvestment,
  createUser,
  deleteInvestment,
  deleteUser,
  listInvestments,
  listUsers,
} from '../../lib/api'
import type {
  ApiCreateInvestmentPayload,
  ApiCreateUserPayload,
  ApiInvestmentStatus,
  ApiInvestmentType,
  ApiUserStatus,
  Currency,
} from '../../types/models'
import { ApiError } from '../../lib/api'

type UserFormValues = {
  first_name: string
  last_name: string
  email: string
  password: string
  phone_number: string
  user_status: ApiUserStatus
}

const defaultUserValues: UserFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone_number: '',
  user_status: 'active user',
}

type InvestmentFormValues = {
  type: ApiInvestmentType
  name: string
  note: string
  status: ApiInvestmentStatus
  unit_price: string
  quantity: string
  currency: Currency
  maturity_date: string
  date: string
  user_id: string
}

const defaultInvestmentValues: InvestmentFormValues = {
  type: 'stocks',
  name: '',
  note: '',
  status: 'active',
  unit_price: '',
  quantity: '',
  currency: 'MYR',
  maturity_date: '',
  date: new Date().toISOString().slice(0, 10),
  user_id: '',
}

const investmentTypeLabels: Record<ApiInvestmentType, string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  index_fund: 'Index Fund',
  reit: 'REIT',
  fixed_deposit: 'Fixed Deposit',
  epf: 'EPF',
  property: 'Property',
  business: 'Business',
  other: 'Other',
}

const BackendIntegrationPanel = () => {
  const queryClient = useQueryClient()
  const usersQuery = useQuery({
    queryKey: ['api-users'],
    queryFn: listUsers,
  })
  const investmentsQuery = useQuery({
    queryKey: ['api-investments'],
    queryFn: () => listInvestments({ limit: 50 }),
  })

  const userForm = useForm<UserFormValues>({
    defaultValues: defaultUserValues,
  })
  const investmentForm = useForm<InvestmentFormValues>({
    defaultValues: defaultInvestmentValues,
  })

  const createUserMutation = useMutation({
    mutationFn: (payload: ApiCreateUserPayload) => createUser(payload),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['api-users'] })
      userForm.reset(defaultUserValues)
      if (!investmentForm.getValues('user_id')) {
        investmentForm.setValue('user_id', created.id, { shouldValidate: true })
      }
    },
  })

  const createInvestmentMutation = useMutation({
    mutationFn: (payload: ApiCreateInvestmentPayload) => createInvestment(payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['api-investments'] })
      investmentForm.reset({
        ...defaultInvestmentValues,
        user_id: variables.user_id,
      })
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-users'] })
      queryClient.invalidateQueries({ queryKey: ['api-investments'] })
    },
  })

  const deleteInvestmentMutation = useMutation({
    mutationFn: (investmentId: string) => deleteInvestment(investmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-investments'] })
    },
  })

  const availableUsers = usersQuery.data ?? []

  const handleUserSubmit = userForm.handleSubmit(async (values) => {
    try {
      const payload: ApiCreateUserPayload = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        password: values.password,
        user_status: values.user_status,
        phone_number: values.phone_number.trim() || undefined,
      }
      await createUserMutation.mutateAsync(payload)
      userForm.clearErrors('root')
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Unable to save user'
      userForm.setError('root', { type: 'server', message })
    }
  })

  const handleInvestmentSubmit = investmentForm.handleSubmit(async (values) => {
    if (!values.user_id) {
      investmentForm.setError('user_id', { type: 'manual', message: 'Select a user first' })
      return
    }
    const unitPrice = Number(values.unit_price)
    const quantity = Number(values.quantity)
    if (Number.isNaN(unitPrice)) {
      investmentForm.setError('unit_price', { type: 'manual', message: 'Enter a number' })
      return
    }
    if (Number.isNaN(quantity)) {
      investmentForm.setError('quantity', { type: 'manual', message: 'Enter a number' })
      return
    }
    try {
      const payload: ApiCreateInvestmentPayload = {
        type: values.type,
        name: values.name.trim(),
        note: values.note.trim() || undefined,
        status: values.status,
        unit_price: Math.round(unitPrice),
        quantity: Math.round(quantity),
        currency: values.currency,
        maturity_date: values.maturity_date || undefined,
        date: values.date,
        user_id: values.user_id,
      }
      await createInvestmentMutation.mutateAsync(payload)
      investmentForm.clearErrors('root')
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to save investment'
      investmentForm.setError('root', { type: 'server', message })
    }
  })

  const investmentItems = investmentsQuery.data?.items ?? []

  const isBusy =
    createUserMutation.isPending ||
    createInvestmentMutation.isPending ||
    deleteUserMutation.isPending ||
    deleteInvestmentMutation.isPending

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6 shadow-card">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">FastAPI data bridge</h2>
          <p className="text-sm text-slate-400">
            Connected to <span className="font-medium text-slate-200">{apiBaseUrl}</span>
          </p>
          <p className="text-xs text-slate-500">
            Create or delete records below and watch the React queries refresh from the API.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          {isBusy ? 'Syncing with backend�?�' : 'Idle'}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleUserSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div>
            <h3 className="text-base font-semibold text-white">Create user</h3>
            <p className="text-xs text-slate-400">Matches the columns defined in the Excel schema.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">First name</span>
              <input
                {...userForm.register('first_name', { required: 'Required' })}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
              {userForm.formState.errors.first_name ? (
                <span className="text-xs text-rose-400">{userForm.formState.errors.first_name.message}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Last name</span>
              <input
                {...userForm.register('last_name', { required: 'Required' })}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
              {userForm.formState.errors.last_name ? (
                <span className="text-xs text-rose-400">{userForm.formState.errors.last_name.message}</span>
              ) : null}
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase text-slate-400">Email</span>
            <input
              {...userForm.register('email', { required: 'Required' })}
              type="email"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            />
            {userForm.formState.errors.email ? (
              <span className="text-xs text-rose-400">{userForm.formState.errors.email.message}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase text-slate-400">Password</span>
            <input
              {...userForm.register('password', { required: 'Required', minLength: { value: 4, message: 'Min 4 characters' } })}
              type="password"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            />
            {userForm.formState.errors.password ? (
              <span className="text-xs text-rose-400">{userForm.formState.errors.password.message}</span>
            ) : null}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Phone number</span>
              <input
                {...userForm.register('phone_number')}
                placeholder="+60 12 345 6789"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Status</span>
              <select
                {...userForm.register('user_status')}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              >
                <option value="active user">Active</option>
                <option value="inactive user">Inactive</option>
                <option value="deleted user">Deleted</option>
              </select>
            </label>
          </div>
          {userForm.formState.errors.root ? (
            <p className="text-xs text-rose-400">{userForm.formState.errors.root.message}</p>
          ) : null}
          <button
            type="submit"
            disabled={createUserMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createUserMutation.isPending ? 'Saving�?�' : 'Create user'}
          </button>
        </form>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Users ({availableUsers.length})</h3>
              <p className="text-xs text-slate-400">
                {usersQuery.isFetching ? 'Refreshing from API�?�' : 'Live view from FastAPI'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => usersQuery.refetch()}
              className="rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-brand-500 hover:text-brand-200"
            >
              Refresh
            </button>
          </div>
          {availableUsers.length === 0 ? (
            <p className="text-sm text-slate-400">No users yet. Use the form to create one.</p>
          ) : (
            <ul className="divide-y divide-slate-800 text-sm">
              {availableUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium text-slate-100">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <p className="text-xs text-slate-500">Status: {user.user_status}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteUserMutation.mutate(user.id)}
                    disabled={deleteUserMutation.isPending}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleInvestmentSubmit}
          className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <div>
            <h3 className="text-base font-semibold text-white">Create investment</h3>
            <p className="text-xs text-slate-400">Linked to the selected user.</p>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase text-slate-400">Owner</span>
            <select
              {...investmentForm.register('user_id')}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            >
              <option value="">Select a user</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
            {investmentForm.formState.errors.user_id ? (
              <span className="text-xs text-rose-400">{investmentForm.formState.errors.user_id.message}</span>
            ) : null}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Type</span>
              <select
                {...investmentForm.register('type')}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              >
                {Object.entries(investmentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Status</span>
              <select
                {...investmentForm.register('status')}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase text-slate-400">Name</span>
            <input
              {...investmentForm.register('name', { required: 'Required' })}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            />
            {investmentForm.formState.errors.name ? (
              <span className="text-xs text-rose-400">{investmentForm.formState.errors.name.message}</span>
            ) : null}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Unit price</span>
              <input
                {...investmentForm.register('unit_price', { required: 'Required' })}
                type="number"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
              {investmentForm.formState.errors.unit_price ? (
                <span className="text-xs text-rose-400">{investmentForm.formState.errors.unit_price.message}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Quantity</span>
              <input
                {...investmentForm.register('quantity', { required: 'Required' })}
                type="number"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
              {investmentForm.formState.errors.quantity ? (
                <span className="text-xs text-rose-400">{investmentForm.formState.errors.quantity.message}</span>
              ) : null}
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Currency</span>
              <select
                {...investmentForm.register('currency')}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              >
                <option value="MYR">MYR</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Placement date</span>
              <input
                {...investmentForm.register('date', { required: 'Required' })}
                type="date"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Maturity date</span>
              <input
                {...investmentForm.register('maturity_date')}
                type="date"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase text-slate-400">Notes</span>
              <input
                {...investmentForm.register('note')}
                placeholder="Optional memo"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
            </label>
          </div>
          {investmentForm.formState.errors.root ? (
            <p className="text-xs text-rose-400">{investmentForm.formState.errors.root.message}</p>
          ) : null}
          <button
            type="submit"
            disabled={createInvestmentMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createInvestmentMutation.isPending ? 'Saving�?�' : 'Add investment'}
          </button>
        </form>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Investments ({investmentItems.length})</h3>
              <p className="text-xs text-slate-400">
                {investmentsQuery.isFetching ? 'Refreshing from API�?�' : `Total rows: ${investmentsQuery.data?.total ?? 0}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => investmentsQuery.refetch()}
              className="rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-brand-500 hover:text-brand-200"
            >
              Refresh
            </button>
          </div>
          {investmentItems.length === 0 ? (
            <p className="text-sm text-slate-400">Investments that are created through the form appear here.</p>
          ) : (
            <ul className="divide-y divide-slate-800 text-sm">
              {investmentItems.map((investment) => (
                <li key={investment.id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium text-slate-100">
                      {investment.name} <span className="text-xs text-slate-500">({investment.type})</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {investment.quantity} units × {investment.unit_price} {investment.currency}
                    </p>
                    <p className="text-xs text-slate-500">Status: {investment.status}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteInvestmentMutation.mutate(investment.id)}
                    disabled={deleteInvestmentMutation.isPending}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export default BackendIntegrationPanel
