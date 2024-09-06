import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import fetchGuides from "./fetchGuides";

const HomePage = () => {
  const [guides, setGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  const handleGuideSelect = (e) => {
    setSelectedGuide(e.target.value);
  };

  const handleEditClick = () => {
    if (selectedGuide) {
      navigate(`/edit/${selectedGuide}`);
    }
  };

  if (loading) return <div className="text-center mt-10">Yükleniyor...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="container mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        Rehber Yönetim Sistemi
      </h1>
      <div className="flex justify-center items-center space-x-4">
        <select
          value={selectedGuide}
          onChange={handleGuideSelect}
          className="block w-64 bg-white border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Rehber Seçin</option>
          {guides.map((guide) => (
            <option key={guide.id} value={guide.id}>
              {guide.productCode}
            </option>
          ))}
        </select>
        <button
          onClick={handleEditClick}
          disabled={!selectedGuide}
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
            !selectedGuide && "opacity-50 cursor-not-allowed"
          }`}
        >
          Düzenle
        </button>
      </div>
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate("/create")}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Yeni Rehber Oluştur
        </button>
      </div>
    </div>
  );
};

export default HomePage;
