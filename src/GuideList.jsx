import React, { useState, useEffect } from "react";
import fetchGuides from "./fetchGuides";

// Timestamp'i okunabilir bir string'e çeviren yardımcı fonksiyon
const formatDate = (timestamp) => {
  if (timestamp && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }
  return "Tarih bilgisi yok";
};

const GuideList = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGuides = async () => {
      try {
        const guideData = await fetchGuides();
        setGuides(guideData);
        setLoading(false);
      } catch (err) {
        setError("Kılavuzları yüklerken bir hata oluştu.");
        setLoading(false);
      }
    };

    loadGuides();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="guide-list">
      <h2>Kılavuz Listesi</h2>
      {guides.map((guide) => (
        <div key={guide.id} className="guide-item">
          <h3>{guide.productCode}</h3>
          <p>Oluşturulma Tarihi: {formatDate(guide.createdAt)}</p>
          <p>
            Ürün Fotoğrafları:{" "}
            {guide.productPhotos ? guide.productPhotos.length : 0}
          </p>
          <p>Parça Sayısı: {guide.partImages ? guide.partImages.length : 0}</p>
          <p>Adım Sayısı: {guide.steps ? guide.steps.length : 0}</p>
        </div>
      ))}
    </div>
  );
};

export default GuideList;
