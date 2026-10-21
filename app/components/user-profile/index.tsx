'use client'
import { HeadingText } from "@/app/components/shared/heading-text";
import Image from '@/lib/platform/image'
import Link from '@/lib/platform/link'
import { Icon } from '@iconify/react/dist/iconify.js'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import BreadcrumbComp from '@/app/(dashboard-layout)/layout/shared/breadcrumb/breadcrumb-comp'
import StyleDivider from '../shared/StyleDivider'
import { currentUser } from '@/lib/profile'
import { usePersonal, patchPersonal, type Personal, type Address } from '@/app/context/personal-context'
import { useLanguage } from '@/app/context/language-context'

const UserProfile = () => {
  const { t } = useLanguage()
  const [openModal, setOpenModal] = useState(false)
  const [modalType, setModalType] = useState<'personal' | 'address' | null>(
    null
  )

  const BCrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: 'Userprofile',
    },
  ]

  const { profile } = usePersonal()
  const personal = profile.data?.personal ?? {firstName:'',lastName:'',email:'',phone:'',position:'',facebook:'',linkedin:'',github:'',instagram:''}
  const address = profile.data?.address ?? {location:'',state:'',pin:'',zip:'',taxNo:''}
  const [tempPersonal, setTempPersonal] = useState<Personal>(personal)
  const [tempAddress, setTempAddress] = useState<Address>(address)
  const [draftRevision,setDraftRevision] = useState(0)
  const [saveError,setSaveError] = useState('')
  const [saving,setSaving] = useState(false)
  const openEditor = (kind:'personal'|'address') => {
    setTempPersonal(personal);setTempAddress(address);setDraftRevision(profile.data!.revision)
    setSaveError('');setModalType(kind);setOpenModal(true)
  }
  const handleSave = async () => {
    setSaving(true);setSaveError('')
    try {
      const saved=await patchPersonal<NonNullable<typeof profile.data>>('/api/profile',{
        expectedRevision:draftRevision,...(modalType==='personal'?{personal:tempPersonal}:{address:tempAddress})
      })
      await profile.mutate(saved,{revalidate:false});setOpenModal(false)
    } catch(e) {setSaveError((e as Error).message)} finally {setSaving(false)}
  }
  if(profile.error)return <p role="alert">{profile.error.message}</p>
  if(!profile.data)return <p role="status">Đang tải hồ sơ…</p>

  const socialLinks = [
    { href: personal.facebook, icon: 'streamline-logos:facebook-logo-2-solid', label: 'Facebook' },
    { href: personal.linkedin, icon: 'mdi:linkedin', label: 'LinkedIn' },
    { href: personal.github, icon: 'ion:logo-github', label: 'GitHub' },
    { href: personal.instagram, icon: 'mdi:instagram', label: 'Instagram' },
  ].filter((item) => item.href)

  return (
    <div className="flex flex-col p-px bg-border gap-px">
      <BreadcrumbComp title="User Profile" items={BCrumb} />
      <StyleDivider />
      <div className='flex flex-col gap-px bg-border'>
        <Card className='p-6 overflow-hidden'>
          <div className='flex flex-col sm:flex-row items-center gap-6 rounded-xl relative w-full break-words'>
            <div>
              <Image
                src={currentUser.avatar}
                alt={currentUser.name}
                width={80}
                height={80}
                className='rounded-full'
              />
            </div>
            <div className='flex flex-wrap gap-4 justify-center sm:justify-between items-center w-full'>
              <div className='flex flex-col sm:text-left text-center gap-1.5'>
                <h5 className='card-title'><HeadingText>
                  {personal.firstName} {personal.lastName}
                </HeadingText></h5>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {t("Hi, I'm bin")}
                </p>
                <div className='flex flex-wrap items-center gap-1 md:gap-3'>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t(personal.position)}
                  </p>
                  <div className='hidden h-4 w-px bg-gray-300 dark:bg-gray-700 xl:block'></div>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {address.location || '—'}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                {socialLinks.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label={item.label}
                    className='flex h-11 w-11 items-center justify-center gap-2 rounded-full shadow-md border border-border hover:bg-gray-50 dark:hover:bg-white/[0.03] dark:hover:text-gray-200'>
                    <Icon icon={item.icon} width='20' height='20' />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className='grid grid-cols-1 xl:grid-cols-2 gap-px'>
          <div className='space-y-6 bg-background md:p-6 p-4 relative w-full break-words'>
            <h5 className='card-title'><HeadingText>{t('Personal Information')}</HeadingText></h5>
            <p className='text-sm text-gray-500 dark:text-gray-400'>{t(currentUser.bio)}</p>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32'>
              <div>
                <p className='text-xs text-gray-500'>{t('First Name')}</p>
                <p>{personal.firstName}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>{t('Last Name')}</p>
                <p>{personal.lastName}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>{t('Email')}</p>
                <p>{personal.email || '—'}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>{t('Phone')}</p>
                <p>{personal.phone || '—'}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>{t('Position')}</p>
                <p>{t(personal.position)}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>{t('Workplace')}</p>
                <p>{currentUser.workplace}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>{t('Education')}</p>
                <p>{currentUser.education} · {t(currentUser.fieldOfStudy)}</p>
              </div>
            </div>
            <div className='flex justify-end'>
              <Button
                onClick={() => {
                  openEditor('personal')
                }}
                className='flex items-center gap-1.5 rounded-md'>
                <Icon icon='ic:outline-edit' width='18' height='18' /> {t('Edit')}
              </Button>
            </div>
          </div>

          <div className='space-y-6 bg-background md:p-6 p-4 relative w-full break-words'>
            <h5 className='card-title'><HeadingText>{t('Address Details')}</HeadingText></h5>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32'>
              <div>
                <p className='text-xs text-gray-500'>{t('Location')}</p>
                <p>{address.location || '—'}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>{t('Province / State')}</p>
                <p>{address.state || '—'}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>{t('PIN Code')}</p>
                <p>{address.pin || '—'}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>{t('ZIP')}</p>
                <p>{address.zip || '—'}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>{t('Federal Tax No.')}</p>
                <p>{address.taxNo || '—'}</p>
              </div>
            </div>
            <div className='flex justify-end'>
              <Button
                onClick={() => {
                  openEditor('address')
                }}
                className='flex items-center gap-1.5 rounded-md'>
                <Icon icon='ic:outline-edit' width='18' height='18' /> {t('Edit')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent size="lg" >
          <DialogHeader>
            <DialogTitle className='mb-4'>
              {modalType === 'personal'
                ? t('Edit Personal Information')
                : t('Edit Address Details')}
            </DialogTitle>
          </DialogHeader>
          {saveError && <Alert variant="destructive"><AlertDescription>{saveError}</AlertDescription></Alert>}

          {modalType === 'personal' ? (
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='firstName'>{t('First Name')}</Label>
                <Input
                  id='firstName'
                  placeholder={t('First Name')}
                  value={tempPersonal.firstName}
                  onChange={(e) =>
                    setTempPersonal({
                      ...tempPersonal,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='lastName'>{t('Last Name')}</Label>
                <Input
                  id='lastName'
                  placeholder={t('Last Name')}
                  value={tempPersonal.lastName}
                  onChange={(e) =>
                    setTempPersonal({
                      ...tempPersonal,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='email'>{t('Email')}</Label>
                <Input
                  id='email'
                  placeholder={t('Email')}
                  value={tempPersonal.email}
                  onChange={(e) =>
                    setTempPersonal({ ...tempPersonal, email: e.target.value })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='phone'>{t('Phone')}</Label>
                <Input
                  id='phone'
                  placeholder={t('Phone')}
                  value={tempPersonal.phone}
                  onChange={(e) =>
                    setTempPersonal({ ...tempPersonal, phone: e.target.value })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='position'>{t('Position')}</Label>
                <Input
                  id='position'
                  placeholder={t('Position')}
                  value={tempPersonal.position}
                  onChange={(e) =>
                    setTempPersonal({
                      ...tempPersonal,
                      position: e.target.value,
                    })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='facebook'>{t('Facebook URL')}</Label>
                <Input
                  id='facebook'
                  placeholder={t('Facebook URL')}
                  value={tempPersonal.facebook}
                  onChange={(e) =>
                    setTempPersonal({
                      ...tempPersonal,
                      facebook: e.target.value,
                    })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='linkedin'>{t('LinkedIn URL')}</Label>
                <Input
                  id='linkedin'
                  placeholder='linkedin.com/in/tai-khoan'
                  value={tempPersonal.linkedin}
                  onChange={(e) =>
                    setTempPersonal({
                      ...tempPersonal,
                      linkedin: e.target.value,
                    })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='github'>{t('GitHub URL')}</Label>
                <Input
                  id='github'
                  placeholder='github.com/tai-khoan'
                  value={tempPersonal.github}
                  onChange={(e) =>
                    setTempPersonal({ ...tempPersonal, github: e.target.value })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='instagram'>{t('Instagram URL')}</Label>
                <Input
                  id='instagram'
                  placeholder={t('Instagram URL')}
                  value={tempPersonal.instagram}
                  onChange={(e) =>
                    setTempPersonal({
                      ...tempPersonal,
                      instagram: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='location'>{t('Location')}</Label>
                <Input
                  id='location'
                  placeholder={t('Location')}
                  value={tempAddress.location}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, location: e.target.value })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='state'>{t('Province / State')}</Label>
                <Input
                  id='state'
                  placeholder={t('Province / State')}
                  value={tempAddress.state}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, state: e.target.value })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='pin'>{t('PIN Code')}</Label>
                <Input
                  id='pin'
                  placeholder={t('PIN Code')}
                  value={tempAddress.pin}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, pin: e.target.value })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='zip'>{t('ZIP')}</Label>
                <Input
                  id='zip'
                  placeholder={t('ZIP')}
                  value={tempAddress.zip}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, zip: e.target.value })
                  }
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='taxNo'>{t('Federal Tax No.')}</Label>
                <Input
                  id='taxNo'
                  placeholder={t('Federal Tax No.')}
                  value={tempAddress.taxNo}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, taxNo: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter className='flex gap-2 mt-4'>
            <Button
              className='rounded-md'
              disabled={saving} onClick={handleSave}>
              {t('Save Changes')}
            </Button>
            <Button
              className='rounded-md bg-lighterror dark:bg-darkerror text-error hover:bg-error hover:text-white'
              onClick={() => setOpenModal(false)}>
              {t('Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserProfile
