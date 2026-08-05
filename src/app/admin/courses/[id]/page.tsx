'use client';

import { useState, use, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Info, Layers, Users as UsersIcon, DollarSign, Mail, BookOpen, CreditCard, Video, AlertTriangle, PlayCircle, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import styles from './courseAdmin.module.css';
import Link from 'next/link';

import GeneralData from './tabs/GeneralData';
import Modules from './tabs/Modules';
import Enrollments from './tabs/Enrollments';
import Prices from './tabs/Prices';
import ConfirmationEmail from './tabs/ConfirmationEmail';
import Repository from './tabs/Repository';
import Installments from './tabs/Installments';
import ConnectionGate from './tabs/ConnectionGate';
import DangerZone from './tabs/DangerZone';
import Videos from './tabs/Videos';
import Certificate from './tabs/Certificate';

type TabType = 'general' | 'modules' | 'connectionGate' | 'prices' | 'enrollments' | 'confirmEmail' | 'repository' | 'installments' | 'videos' | 'certificate' | 'danger';

export default function CourseAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'general');
  const [courseTitle, setCourseTitle] = useState('...');
  const [pendingCount, setPendingCount] = useState(0);
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // La barra de pestañas puede no entrar en pantallas angostas: mostramos flechas
  // cuando hay contenido oculto a los costados, en vez de depender de que la
  // alumna/admin descubra que se puede arrastrar para scrollear.
  useEffect(() => {
    const el = tabsListRef.current;
    if (!el) return;
    const updateScrollState = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const scrollTabs = (dir: -1 | 1) => {
    tabsListRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = tabsListRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  const tabs = [
    { id: 'general',      label: 'Datos Generales',       icon: Info },
    { id: 'modules',      label: 'Módulos',                icon: Layers },
    { id: 'connectionGate', label: 'Acceso a Clases',       icon: Video },
    { id: 'prices',       label: 'Precios',                icon: DollarSign },
    { id: 'enrollments',  label: 'Inscripciones',          icon: UsersIcon },
    { id: 'confirmEmail', label: 'Email de confirmación',  icon: Mail },
    { id: 'repository',    label: 'Repositorio',             icon: BookOpen },
    { id: 'installments',  label: 'Cuotas',                  icon: CreditCard },
    { id: 'videos',        label: 'Videos',                  icon: PlayCircle },
    { id: 'certificate',   label: 'Certificado',             icon: Award },
    { id: 'danger',        label: 'Zona de riesgo',          icon: AlertTriangle },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':      return <GeneralData courseId={courseId} onTitleChange={(t) => setCourseTitle(t)} />;
      case 'modules':      return <Modules courseId={courseId} />;
      case 'connectionGate': return <ConnectionGate courseId={courseId} />;
      case 'prices':       return <Prices courseId={courseId} />;
      case 'enrollments':  return <Enrollments courseId={courseId} />;
      case 'confirmEmail': return <ConfirmationEmail courseId={courseId} />;
      case 'repository':    return <Repository courseId={courseId} />;
      case 'installments':  return <Installments courseId={courseId} />;
      case 'videos':        return <Videos courseId={courseId} />;
      case 'certificate':   return <Certificate courseId={courseId} />;
      case 'danger':        return <DangerZone courseId={courseId} courseTitle={courseTitle} />;
      default:              return null;
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
          <div className={styles.tabsRow}>
            {canScrollLeft && (
              <button
                type="button"
                className={`${styles.tabsScrollBtn} ${styles.tabsScrollBtnLeft}`}
                onClick={() => scrollTabs(-1)}
                aria-label="Ver pestañas anteriores"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div className={styles.tabsList} ref={tabsListRef} onWheel={handleTabsWheel}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tabItem} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  style={tab.id === 'danger' ? { color: activeTab === 'danger' ? '#dc2626' : '#f87171', borderBottomColor: activeTab === 'danger' ? '#dc2626' : undefined } : undefined}
                >
                  <tab.icon size={18} />
                  {tab.label}
                  {tab.id === 'enrollments' && pendingCount > 0 && (
                    <span className={styles.tabBadge}>{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>
            {canScrollRight && (
              <button
                type="button"
                className={`${styles.tabsScrollBtn} ${styles.tabsScrollBtnRight}`}
                onClick={() => scrollTabs(1)}
                aria-label="Ver más pestañas"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          <div className={styles.tabContent}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
