import React, { useState } from 'react';
import styles from './CaptionGenerator.module.css';

const CaptionGenerator = () => {
  const [channel, setChannel] = useState('jim_icg');
  const [bullets, setBullets] = useState('');
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const channelInfo = {
    jim_icg: {
      label: '@JIM_ICG (Hauptkanal)',
      description: 'Warm, einladend, offiziell. 3-6 Zeilen. Events, Predigten, Gemeindeleben.',
    },
    jimworship: {
      label: '@jimworship (Worship Band)',
      description: 'Andachtsvoll, spirituell. 2-4 Zeilen. Weniger ist mehr.',
    },
    jim_ketawa: {
      label: '@jim_ketawa (Fun & Comedy)',
      description: 'Locker, humorvoll, authentisch. 1-3 Zeilen. Für jüngere Generation.',
    },
    youtube: {
      label: 'YouTube (JIM)',
      description: 'Einladend, professionell, ausführlich. 6-10 Zeilen. Breites Publikum.',
    },
  };

  const handleGenerate = async () => {
    if (!bullets.trim()) {
      alert('Bitte gib Stichpunkte ein!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, bullets }),
      });

      if (!response.ok) {
        throw new Error('API Error: ' + response.status);
      }

      const data = await response.json();
      setOutput(data);
      setCopiedId(null);
    } catch (error) {
      alert('Fehler bei der Caption-Generierung: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setBullets('');
    setOutput(null);
    setCopiedId(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>📝 Caption Generator</h3>
          <p className={styles.subtitle}>
            Wähle einen Kanal, gib Stichpunkte ein, und Claude generiert eine fertige Caption!
          </p>
        </div>

        {/* Channel Selection */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Kanal wählen</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className={styles.select}
          >
            {Object.entries(channelInfo).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>
          <p className={styles.description}>{channelInfo[channel].description}</p>
        </div>

        {/* Bullets Input */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Stichpunkte eingeben</label>
          <textarea
            value={bullets}
            onChange={(e) => setBullets(e.target.value)}
            placeholder="z.B. Sonntagsimpuls von Pastor Karlo, Thema: Vergebung, Zu Gott kommen, Einladung zum Gottesdienst..."
            className={styles.textarea}
          />
        </div>

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={styles.primaryButton}
          >
            {loading ? '⏳ Generiert...' : '✨ Generate Caption'}
          </button>
          <button onClick={handleClear} className={styles.secondaryButton}>
            ✕ Löschen
          </button>
        </div>

        {/* Output Section */}
        {output && !loading && (
          <div className={styles.outputSection}>
            {/* English Caption */}
            <div className={styles.outputBox}>
              <div className={styles.outputHeader}>
                <span className={styles.outputLabel}>🇬🇧 English</span>
                <button
                  onClick={() =>
                    handleCopy(output.captionEN, 'english')
                  }
                  className={styles.copyButton}
                >
                  {copiedId === 'english' ? '✓ Kopiert!' : '📋 Copy'}
                </button>
              </div>
              <p className={styles.outputText}>{output.captionEN}</p>
            </div>

            {/* Indonesian Caption */}
            <div className={styles.outputBox}>
              <div className={styles.outputHeader}>
                <span className={styles.outputLabel}>🇮🇩 Indonesian</span>
                <button
                  onClick={() =>
                    handleCopy(output.captionID, 'indonesian')
                  }
                  className={styles.copyButton}
                >
                  {copiedId === 'indonesian' ? '✓ Kopiert!' : '📋 Copy'}
                </button>
              </div>
              <p className={styles.outputText}>{output.captionID}</p>
            </div>

            {/* Hashtags */}
            <div className={styles.outputBox}>
              <div className={styles.outputHeader}>
                <span className={styles.outputLabel}>#️⃣ Hashtags</span>
                <button
                  onClick={() =>
                    handleCopy(output.hashtags, 'hashtags')
                  }
                  className={styles.copyButton}
                >
                  {copiedId === 'hashtags' ? '✓ Kopiert!' : '📋 Copy'}
                </button>
              </div>
              <p className={styles.outputText}>{output.hashtags}</p>
            </div>

            {/* Regenerate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={styles.regenerateButton}
            >
              🔄 Regenerate
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingSection}>
            <div className={styles.spinner}></div>
            <p>Claude generiert deine Caption...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptionGenerator;
