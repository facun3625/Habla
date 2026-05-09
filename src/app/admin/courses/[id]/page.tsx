'use client';

import { useState, use, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Info, Layers, Users as UsersIcon, DollarSign, Mail, BookOpen } from 'lucide-react';
import styles from './courseAdmin.module.css';
import Link from 'next/link';

import GeneralData from './tabs/GeneralData';
import Modules from './tabs/Modules';
import Enrollments from './tabs/Enrollments';
import Prices from './tabs/Prices';
import ConfirmationEmail from './tabs/ConfirmationEmail';
import Repository from './tabs/Repository';

type TabType = 'general' | 'modules' | 'prices' | 'enrollments' | 'confirmEmail' | 'repository';

export default function CourseAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'general');
  const [courseTitle, setCourseTitle] = useState('...');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', tab);
    router.push(`/admin/courses/${courseId}?${newParams.toString()}`);
  };

  const fetchPendingCount = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/enrollments`);
      if (res.ok) {
        const data = await res.json();
        const count = data.filter((e: any) => e.status === 'COMPROBANTE_SUBIDO').length;
        setPendingCount(count);
      }
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  };

  useEffect(() => {
    fetchPendingCount();
    window.addEventListener('refreshNotifications', fetchPendingCount);
    return () => window.removeEventListener('refreshNotifications', fetchPendingCount);
  }, [courseId]);

  const tabs = [
    { id: 'general',      label: 'Datos Generales',       icon: Info },
    { id: 'modules',      label: 'Módulos',                icon: Layers },
    { id: 'prices',       label: 'Precios',                icon: DollarSign },
    { id: 'enrollments',  label: 'Inscripciones',          icon: UsersIcon },
    { id: 'confirmEmail', label: 'Email de confirmación',  icon: Mail },
    { id: 'repository',   label: 'Repositorio',             icon: BookOpen },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':      return <GeneralData courseId={courseId} onTitleChange={(t) => setCourseTitle(t)} />;
      case 'modules':      return <Modules courseId={courseId} />;
      case 'prices':       return <Prices courseId={courseId} />;
      case 'enrollments':  return <Enrollments courseId={courseId} />;
      case 'confirmEmail': return <ConfirmationEmail courseId={courseId} />;
      case 'repository':   return <Repository courseId={courseId} />;
      default:             return null;
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/admin/courses" className={styles.backLink}>
            <ArrowLeft size={18} />
            Volver a Cursos
          </Link>
        </div>

        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.statusDot} />
            <h2 className={styles.title}>Administrar Curso: <span>{courseTitle}</span></h2>
          </div>
        </div>

        <div className={styles.tabsContainer}>
          <div className={styles.tabsList}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tabItem} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => handleTabChange(tab.id as TabType)}
              >
                <tab.icon size={18} />
                {tab.label}
                {tab.id === 'enrollments' && pendingCount > 0 && (
                  <span className={styles.tabBadge}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
