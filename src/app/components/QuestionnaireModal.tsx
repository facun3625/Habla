'use client';

import { useState } from 'react';
import { ClipboardList, ArrowRight, Loader } from 'lucide-react';
import styles from './QuestionnaireModal.module.css';

interface Props {
  initialName?: string | null;
  onDone: (updatedName: string) => void;
}

function calcAge(dateStr: string): number | null {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export default function QuestionnaireModal({ initialName, onDone }: Props) {
  const [name, setName] = useState(initialName ?? '');
  const [birthDate, setBirthDate] = useState('');
  const [dni, setDni] = useState('');
  const [city, setCity] = useState('');
  const [apraxia, setApraxia] = useState<boolean | null>(null);
  const [apraxiaDetail, setApraxiaDetail] = useState('');
  const [otherTraining, setOtherTraining] = useState<boolean | null>(null);
  const [otherTrainingDetail, setOtherTrainingDetail] = useState('');
  const [methodYes, setMethodYes] = useState<boolean | null>(null);
  const [methodText, setMethodText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const age = calcAge(birthDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Ingresá tu nombre y apellido.'); return; }
    if (!birthDate) { setError('Ingresá tu fecha de nacimiento.'); return; }
    if (!dni.trim()) { setError('Ingresá tu DNI.'); return; }
    if (!city.trim()) { setError('Ingresá la ciudad donde ejercés.'); return; }
    if (apraxia === null) { setError('Respondé la pregunta sobre experiencia con apraxia.'); return; }
    if (otherTraining === null) { setError('Respondé si tomaste otras formaciones.'); return; }
    if (methodYes === null) { setError('Respondé si estás entrenado en algún método específico.'); return; }

    setLoading(true); setError('');
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        birthDate,
        dni: dni.trim(),
        city: city.trim(),
        hasApraxiaExperience: apraxia,
        apraxiaExperienceDetail: apraxia ? apraxiaDetail.trim() || null : null,
        hasOtherTraining: otherTraining,
        otherTrainingDetail: otherTraining ? otherTrainingDetail.trim() || null : null,
        specificMethod: methodYes ? methodText.trim() || null : null,
        questionnaireCompleted: true,
      }),
    });
    setLoading(false);
    if (!res.ok) { setError('Error al guardar los datos. Intentá de nuevo.'); return; }
    onDone(name.trim());
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <ClipboardList size={22} />
          </div>
          <div>
            <h2>Completá tu perfil</h2>
            <p>Necesitamos estos datos una sola vez. Se guardarán para todos tus cursos.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre y apellido completo</label>
            <input type="text" className={styles.input} placeholder="Ej: María González" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Fecha de nacimiento</label>
              <input type="date" className={styles.input} value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Edad</label>
              <div className={styles.ageDisplay}>{age !== null ? `${age} años` : '—'}</div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>DNI</label>
              <input type="text" className={styles.input} placeholder="Ej: 30123456" value={dni} onChange={e => setDni(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Ciudad donde ejercés</label>
              <input type="text" className={styles.input} placeholder="Ej: Buenos Aires" value={city} onChange={e => setCity(e.target.value)} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>¿Tenés experiencia trabajando con niños con apraxia?</label>
            <div className={styles.yesNo}>
              <button type="button" className={`${styles.yesNoBtn} ${apraxia === true ? styles.yesNoBtnActive : ''}`} onClick={() => setApraxia(true)}>Sí</button>
              <button type="button" className={`${styles.yesNoBtn} ${apraxia === false ? styles.yesNoBtnActive : ''}`} onClick={() => { setApraxia(false); setApraxiaDetail(''); }}>No</button>
            </div>
            {apraxia && (
              <input type="text" className={styles.input} style={{ marginTop: 8 }} placeholder="Contanos brevemente tu experiencia" value={apraxiaDetail} onChange={e => setApraxiaDetail(e.target.value)} />
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>¿Tomaste otras formaciones en la temática?</label>
            <div className={styles.yesNo}>
              <button type="button" className={`${styles.yesNoBtn} ${otherTraining === true ? styles.yesNoBtnActive : ''}`} onClick={() => setOtherTraining(true)}>Sí</button>
              <button type="button" className={`${styles.yesNoBtn} ${otherTraining === false ? styles.yesNoBtnActive : ''}`} onClick={() => { setOtherTraining(false); setOtherTrainingDetail(''); }}>No</button>
            </div>
            {otherTraining && (
              <input type="text" className={styles.input} style={{ marginTop: 8 }} placeholder="¿Cuáles?" value={otherTrainingDetail} onChange={e => setOtherTrainingDetail(e.target.value)} />
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>¿Estás entrenado en algún método específico?</label>
            <div className={styles.yesNo}>
              <button type="button" className={`${styles.yesNoBtn} ${methodYes === true ? styles.yesNoBtnActive : ''}`} onClick={() => setMethodYes(true)}>Sí</button>
              <button type="button" className={`${styles.yesNoBtn} ${methodYes === false ? styles.yesNoBtnActive : ''}`} onClick={() => { setMethodYes(false); setMethodText(''); }}>No</button>
            </div>
            {methodYes && (
              <input type="text" className={styles.input} style={{ marginTop: 8 }} placeholder="Especificá el método" value={methodText} onChange={e => setMethodText(e.target.value)} />
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading
              ? <><Loader size={15} className={styles.spinner} /> Guardando...</>
              : <>Guardar y continuar <ArrowRight size={15} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
