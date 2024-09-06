import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image,
  Font,
} from "@react-pdf/renderer";
import axios from "axios";

Font.register({
  family: "Noto Sans",
  src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans/files/noto-sans-all-400-normal.woff",
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  productCodePage: {
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    padding: 30,
  },
  productCode: {
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "Noto Sans",
    textAlign: "center",
    marginBottom: 20,
  },
  productPhotosContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  productPhoto: {
    maxWidth: "100%",
    height: 200,
    objectFit: "contain",
    marginBottom: 10,
    padding: 10,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Noto Sans",
  },
  partContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  part: {
    width: "22%",
    marginBottom: 20,
  },
  partImage: {
    width: "100%",
    height: 100,
    objectFit: "contain",
  },
  partDescription: {
    fontSize: 10,
    textAlign: "center",
    fontFamily: "Noto Sans",
    marginTop: 5,
  },
  stepContainer: {
    border: "1px solid #000",
    marginBottom: 20,
    padding: 10,
    fontFamily: "Noto Sans",
  },
  stepContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepText: {
    width: "60%",
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 12,
  },
  stepImage: {
    width: "100%",
    height: 150,
    objectFit: "contain",
  },
});

const fetchImageAsBase64 = async (url) => {
  try {
    const response = await axios.get("/.netlify/functions/getImage", {
      params: { url },
    });
    return `data:${response.data.contentType};base64,${response.data.base64}`;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
};

const PDFDocument = ({ guide, images }) => (
  <Document>
    {/* Ürün Kodu Sayfası */}
    <Page size="A4" style={styles.page}>
      <View style={styles.productCodePage}>
        <Text style={styles.productCode}>{guide.productCode}</Text>
        <View style={styles.productPhotosContainer}>
          {images.productPhotos.map((photo, index) => (
            <Image key={index} src={photo} style={styles.productPhoto} />
          ))}
        </View>
      </View>
    </Page>

    {/* Parçalar Sayfası */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>1. Parçalar</Text>
      <View style={styles.partContainer}>
        {guide.partImages.map((part, index) => (
          <View key={index} style={styles.part}>
            <Image src={images.partImages[index]} style={styles.partImage} />
            <Text style={styles.partDescription}>
              {part.description || "Parça İsmi Yok"}
            </Text>
          </View>
        ))}
      </View>
    </Page>

    {/* Üretim Adımları Sayfası */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Üretim Adımları</Text>
      {guide.steps.map((step, index) => (
        <View key={index} style={styles.stepContainer} wrap={false}>
          <View style={styles.stepContent}>
            <View style={styles.stepText}>
              <Text style={styles.stepNumber}>{index + 1}. Adım</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
            <Image src={images.steps[index]} style={styles.stepImage} />
          </View>
        </View>
      ))}
    </Page>
  </Document>
);

const GuideEditor = () => {
  const [guide, setGuide] = useState(null);
  const [images, setImages] = useState({
    productPhotos: [],
    partImages: [],
    steps: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPDFVisible, setIsPDFVisible] = useState(false);
  const { guideId } = useParams();
  const navigate = useNavigate();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const guideRef = doc(db, "guides", guideId);
        const guideSnap = await getDoc(guideRef);

        if (guideSnap.exists()) {
          const guideData = { id: guideSnap.id, ...guideSnap.data() };
          setGuide(guideData);
          await fetchImages(guideData);
        } else {
          setError("Rehber bulunamadı.");
        }
      } catch (err) {
        setError("Rehber yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [guideId]);

  const fetchImages = async (guideData) => {
    try {
      const productPhotos = await Promise.all(
        guideData.productPhotos.map(fetchImageAsBase64)
      );
      const partImages = await Promise.all(
        guideData.partImages.map((part) => fetchImageAsBase64(part.url))
      );
      const steps = await Promise.all(
        guideData.steps.map((step) => fetchImageAsBase64(step.image))
      );

      setImages({ productPhotos, partImages, steps });
    } catch (error) {
      console.error("Error fetching images:", error);
      setError("Resimler yüklenirken bir hata oluştu.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGuide((prev) => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleStepChange = (index, field, value) => {
    setGuide((prev) => {
      const newSteps = [...prev.steps];
      newSteps[index] = { ...newSteps[index], [field]: value };
      return { ...prev, steps: newSteps };
    });

    setHasUnsavedChanges(true);
  };

  const handleDeletePhoto = async (type, index) => {
    if (!guide) return;

    let oldPhotoUrl;
    let newPhotos;

    if (type === "product") {
      oldPhotoUrl = guide.productPhotos[index];
      newPhotos = guide.productPhotos.filter((_, i) => i !== index);
    } else if (type === "part") {
      oldPhotoUrl = guide.partImages[index].url;
      newPhotos = guide.partImages.filter((_, i) => i !== index);
    } else if (type === "step") {
      oldPhotoUrl = guide.steps[index].image;
      newPhotos = guide.steps.filter((_, i) => i !== index);
    }

    if (oldPhotoUrl) {
      const oldPhotoRef = ref(storage, oldPhotoUrl);
      try {
        await deleteObject(oldPhotoRef);
      } catch (error) {
        console.error("Error deleting old photo:", error);
      }
    }

    setGuide((prev) => {
      if (type === "product") {
        return { ...prev, productPhotos: newPhotos };
      } else if (type === "part") {
        return { ...prev, partImages: newPhotos };
      } else if (type === "step") {
        return { ...prev, steps: newPhotos };
      }
      return prev;
    });

    setHasUnsavedChanges(true);
  };

  const handleChangePhoto = async (type, index, e) => {
    const file = e.target.files[0];
    if (!file || !guide) return;

    const productCodeUp = guide.productCode.toUpperCase();
    let oldPhotoUrl;
    let newPhotoPath;

    if (type === "product") {
      oldPhotoUrl = guide.productPhotos[index];
      newPhotoPath = `guides/${productCodeUp}/product/${guide.productCode.toLowerCase()}_product_${
        index + 1
      }`;
    } else if (type === "part") {
      oldPhotoUrl = guide.partImages[index].url;
      newPhotoPath = `guides/${productCodeUp}/part/${guide.productCode.toLowerCase()}_part_${
        index + 1
      }`;
    } else if (type === "step") {
      oldPhotoUrl = guide.steps[index].image;
      newPhotoPath = `guides/${productCodeUp}/step/${guide.productCode.toLowerCase()}_step_${
        index + 1
      }`;
    }

    // Delete old photo
    if (oldPhotoUrl) {
      const oldPhotoRef = ref(storage, oldPhotoUrl);
      try {
        await deleteObject(oldPhotoRef);
      } catch (error) {
        console.error("Error deleting old photo:", error);
      }
    }

    // Upload new photo
    const newPhotoRef = ref(storage, newPhotoPath);
    await uploadBytes(newPhotoRef, file);
    const downloadURL = await getDownloadURL(newPhotoRef);

    // Update guide state
    setGuide((prev) => {
      if (type === "product") {
        const newProductPhotos = [...prev.productPhotos];
        newProductPhotos[index] = downloadURL;
        return { ...prev, productPhotos: newProductPhotos };
      } else if (type === "part") {
        const newPartImages = [...prev.partImages];
        newPartImages[index] = { ...newPartImages[index], url: downloadURL };
        return { ...prev, partImages: newPartImages };
      } else if (type === "step") {
        const newSteps = [...prev.steps];
        newSteps[index] = { ...newSteps[index], image: downloadURL };
        return { ...prev, steps: newSteps };
      }
      return prev;
    });

    setHasUnsavedChanges(true);
  };

  const fetchGuideData = async () => {
    try {
      const guideRef = doc(db, "guides", guideId);
      const guideSnap = await getDoc(guideRef);

      if (guideSnap.exists()) {
        const guideData = { id: guideSnap.id, ...guideSnap.data() };
        setGuide(guideData);
        await fetchImages(guideData);
      } else {
        setError("Rehber bulunamadı.");
      }
    } catch (err) {
      setError("Rehber yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guide) return;

    try {
      const guideRef = doc(db, "guides", guideId);
      await updateDoc(guideRef, {
        productCode: guide.productCode,
        productPhotos: guide.productPhotos,
        partImages: guide.partImages,
        steps: guide.steps,
      });
      alert("Rehber başarıyla güncellendi!");
      setHasUnsavedChanges(false);
      await fetchGuideData();
    } catch (error) {
      console.error("Rehber güncellenirken hata oluştu:", error);
      alert("Rehber güncellenirken bir hata oluştu.");
    }
  };

  const handleAddPhoto = async (type, e) => {
    const file = e.target.files[0];
    if (!file || !guide) return;

    const productCode = guide.productCode.toUpperCase();
    let newPhotoPath;
    let newPhotoIndex;

    if (type === "product") {
      newPhotoIndex = guide.productPhotos.length;
      newPhotoPath = `guides/${productCode}/product/${guide.productCode.toLowerCase()}_product_${
        newPhotoIndex + 1
      }`;
    } else if (type === "part") {
      newPhotoIndex = guide.partImages.length;
      newPhotoPath = `guides/${productCode}/part/${guide.productCode.toLowerCase()}_part_${
        newPhotoIndex + 1
      }`;
    }

    // Upload new photo
    const newPhotoRef = ref(storage, newPhotoPath);
    await uploadBytes(newPhotoRef, file);
    const downloadURL = await getDownloadURL(newPhotoRef);

    // Update guide state
    setGuide((prev) => {
      if (type === "product") {
        return { ...prev, productPhotos: [...prev.productPhotos, downloadURL] };
      } else if (type === "part") {
        return {
          ...prev,
          partImages: [
            ...prev.partImages,
            { url: downloadURL, description: "" },
          ],
        };
      }
      return prev;
    });
    setHasUnsavedChanges(true);
  };

  const handleAddStep = async (e) => {
    const file = e.target.files[0];
    if (!file || !guide) return;

    const productCode = guide.productCode.toUpperCase();
    const newStepIndex = guide.steps.length;
    const newPhotoPath = `guides/${productCode}/step/${guide.productCode.toLowerCase()}_step_${
      newStepIndex + 1
    }`;

    try {
      // Upload new photo
      const newPhotoRef = ref(storage, newPhotoPath);
      await uploadBytes(newPhotoRef, file);
      const downloadURL = await getDownloadURL(newPhotoRef);

      // Update guide state
      setGuide((prev) => ({
        ...prev,
        steps: [...prev.steps, { image: downloadURL, description: "" }],
      }));

      console.log("Step added successfully");
    } catch (error) {
      console.error("Error adding step:", error);
      alert("Adım eklenirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
    setHasUnsavedChanges(true);
  };

  const handlePartDescriptionChange = (index, newDescription) => {
    setGuide((prev) => {
      const newPartImages = [...prev.partImages];
      newPartImages[index] = {
        ...newPartImages[index],
        description: newDescription,
      };
      return { ...prev, partImages: newPartImages };
    });
    setHasUnsavedChanges(true);
  };

  const handleCreatePDF = (e) => {
    e.preventDefault();
    if (hasUnsavedChanges) {
      alert("Lütfen önce değişiklikleri kaydedin, sonra PDF oluşturun.");
    } else {
      setIsPDFVisible(true);
    }
  };

  if (loading) return <div className="text-center mt-10">Yükleniyor...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (!guide) return null;

  return (
    <div className="container mx-auto p-4 bg-gray-100">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        Rehber Düzenle
      </h1>

      <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="mb-6">
            <label
              htmlFor="productCode"
              className="block text-gray-700 text-lg font-bold mb-2"
            >
              Ürün Kodu
            </label>
            <input
              type="text"
              id="productCode"
              name="productCode"
              value={guide.productCode}
              onChange={handleInputChange}
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Ürün Fotoğrafları (Maksimum 3)
            </h2>
            <div className="flex flex-wrap -mx-2">
              {guide.productPhotos &&
                guide.productPhotos.slice(0, 3).map((photo, index) => (
                  <div key={index} className="w-1/3 px-2 mb-4">
                    <div className="relative bg-gray-200 rounded-lg p-2">
                      <img
                        src={photo}
                        alt={`Ürün ${index + 1}`}
                        className="w-full h-40 object-cover rounded"
                      />
                      <input
                        type="file"
                        onChange={(e) => handleChangePhoto("product", index, e)}
                        className="mt-2 w-full text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto("product", index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition duration-200"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
              {guide.productPhotos && guide.productPhotos.length < 3 && (
                <div className="w-1/3 px-2 mb-4">
                  <div className="bg-gray-200 rounded-lg p-2 h-full flex flex-col justify-center items-center">
                    <input
                      type="file"
                      onChange={(e) => handleAddPhoto("product", e)}
                      className="hidden"
                      id="addProductPhoto"
                    />
                    <label
                      htmlFor="addProductPhoto"
                      className="cursor-pointer text-center"
                    >
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span className="mt-2 block text-sm font-medium text-gray-700">
                        Yeni ürün fotoğrafı ekle
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            {guide.productPhotos && guide.productPhotos.length >= 3 && (
              <p className="text-sm text-red-500 mt-2">
                Maksimum fotoğraf sayısına ulaşıldı (3).
              </p>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Parça Resimleri
            </h2>
            <div className="flex flex-wrap -mx-2">
              {guide.partImages &&
                guide.partImages.map((part, index) => (
                  <div key={index} className="w-1/3 px-2 mb-4">
                    <div className="relative bg-gray-200 rounded-lg p-2">
                      <img
                        src={part.url}
                        alt={`Parça ${index + 1}`}
                        className="w-full h-40 object-cover rounded"
                      />
                      <input
                        type="text"
                        value={part.description}
                        onChange={(e) =>
                          handlePartDescriptionChange(index, e.target.value)
                        }
                        className="mt-2 w-full border rounded py-1 px-2 text-sm"
                        placeholder="Parça açıklaması"
                      />
                      <input
                        type="file"
                        onChange={(e) => handleChangePhoto("part", index, e)}
                        className="mt-2 w-full text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto("part", index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition duration-200"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
              <div className="w-1/3 px-2 mb-4">
                <div className="bg-gray-200 rounded-lg p-2 h-full flex flex-col justify-center items-center">
                  <input
                    type="file"
                    onChange={(e) => handleAddPhoto("part", e)}
                    className="hidden"
                    id="addPartPhoto"
                  />
                  <label
                    htmlFor="addPartPhoto"
                    className="cursor-pointer text-center"
                  >
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="mt-2 block text-sm font-medium text-gray-700">
                      Yeni parça resmi ekle
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Adımlar</h2>
            {guide.steps &&
              guide.steps.map((step, index) => (
                <div
                  key={index}
                  className="mb-6 p-4 bg-gray-100 rounded-lg relative"
                >
                  <h3 className="font-bold mb-2 text-lg">Adım {index + 1}</h3>
                  <img
                    src={step.image}
                    alt={`Adım ${index + 1}`}
                    className="w-full h-60 object-cover rounded mb-2"
                  />
                  <textarea
                    value={step.description}
                    onChange={(e) =>
                      handleStepChange(index, "description", e.target.value)
                    }
                    className="w-full h-24 border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adım açıklaması"
                  />
                  <div className="mt-2 flex items-center">
                    <input
                      type="file"
                      onChange={(e) => handleChangePhoto("step", index, e)}
                      className="flex-grow"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto("step", index)}
                      className="ml-2 bg-red-500 text-white rounded px-4 py-2 hover:bg-red-600 transition duration-200"
                    >
                      Adımı Sil
                    </button>
                  </div>
                </div>
              ))}

            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold mb-2 text-lg">Yeni Adım Ekle</h3>
              <input
                type="file"
                onChange={handleAddStep}
                className="w-full mb-2"
                id="addNewStep"
              />
              <label
                htmlFor="addNewStep"
                className="block text-sm font-medium text-gray-700"
              >
                Yeni adım için fotoğraf yükle
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
            >
              Güncelle
            </button>
            <button
              onClick={handleCreatePDF}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
            >
              PDF Oluştur
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
            >
              İptal
            </button>
          </div>
        </form>
        {hasUnsavedChanges && (
          <p className="text-red-500 mt-4 text-center">
            Kaydedilmemiş değişiklikler var. Lütfen önce "Güncelle" butonuna
            tıklayın.
          </p>
        )}
      </div>

      {isPDFVisible && (
        <div className="mt-8 bg-white shadow-lg rounded-lg p-4">
          <PDFViewer width="100%" height={600}>
            <PDFDocument guide={guide} images={images} />
          </PDFViewer>
        </div>
      )}
    </div>
  );
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Rehber Düzenle</h1>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"></div>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="mb-4">
          <label
            htmlFor="productCode"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Ürün Kodu
          </label>
          <input
            type="text"
            id="productCode"
            name="productCode"
            value={guide.productCode}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Ürün Fotoğrafları</h2>
          <div className="flex flex-wrap">
            {guide.productPhotos &&
              guide.productPhotos.map((photo, index) => (
                <div key={index} className="w-1/3 p-2 relative">
                  <img
                    src={photo}
                    alt={`Ürün ${index + 1}`}
                    className="w-auto h-100"
                  />
                  <input
                    type="file"
                    onChange={(e) => handleChangePhoto("product", index, e)}
                    className="mt-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto("product", index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    X
                  </button>
                </div>
              ))}
            <div className="w-1/3 p-2">
              <input
                type="file"
                onChange={(e) => handleAddPhoto("product", e)}
                className="mt-2"
              />
              <p className="text-sm text-gray-500">Yeni ürün fotoğrafı ekle</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Parça Resimleri</h2>
          <div className="flex flex-wrap">
            {guide.partImages &&
              guide.partImages.map((part, index) => (
                <div key={index} className="w-1/3 p-2 relative">
                  <img
                    src={part.url}
                    alt={`Parça ${index + 1}`}
                    className="w-full h-auto"
                  />
                  <input
                    type="text"
                    value={part.description}
                    onChange={(e) =>
                      handlePartDescriptionChange(index, e.target.value)
                    }
                    className="mt-2 w-full border rounded py-1 px-2"
                    placeholder="Parça açıklaması"
                  />
                  <input
                    type="file"
                    onChange={(e) => handleChangePhoto("part", index, e)}
                    className="mt-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto("part", index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    X
                  </button>
                </div>
              ))}
            <div className="w-1/3 p-2">
              <input
                type="file"
                onChange={(e) => handleAddPhoto("part", e)}
                className="mt-2"
              />
              <p className="text-sm text-gray-500">Yeni parça resmi ekle</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Adımlar</h2>
          {guide.steps &&
            guide.steps.map((step, index) => (
              <div key={index} className="mb-4 p-4 border rounded relative">
                <h3 className="font-bold mb-2">Adım {index + 1}</h3>
                <img
                  src={step.image}
                  alt={`Adım ${index + 1}`}
                  className="w-full h-auto mb-2"
                />
                <textarea
                  value={step.description}
                  onChange={(e) =>
                    handleStepChange(index, "description", e.target.value)
                  }
                  className="w-full h-24 border rounded py-1 px-2"
                  placeholder="Adım açıklaması"
                />
                <div className="mt-2">
                  <input
                    type="file"
                    onChange={(e) => handleChangePhoto("step", index, e)}
                    className="mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto("step", index)}
                    className="bg-red-500 text-white rounded px-2 py-1 ml-2"
                  >
                    Adımı Sil
                  </button>
                </div>
              </div>
            ))}

          <div className="mt-4 p-4 border rounded">
            <h3 className="font-bold mb-2">Yeni Adım Ekle</h3>
            <input type="file" onChange={handleAddStep} className="mb-2" />
            <p className="text-sm text-gray-500">
              Yeni adım için fotoğraf yükle
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Güncelle
          </button>
          <button
            onClick={handleCreatePDF}
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            PDF Oluştur
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            İptal
          </button>
        </div>
      </form>

      {isPDFVisible && (
        <div className="mt-8">
          <PDFViewer width="100%" height={600}>
            <PDFDocument guide={guide} images={images} />
          </PDFViewer>
        </div>
      )}
    </div>
  );
};

export default GuideEditor;
