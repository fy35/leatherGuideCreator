import React, { useState, useRef } from "react";
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

export default function GuideCreator() {
  const [images, setImages] = useState([]);
  const [partImages, setPartImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState({
    image: null,
    description: "",
  });
  const [productCode, setProductCode] = useState("");
  const fileInputRef = useRef(null);
  const partFileInputRef = useRef(null);
  const [productPhotos, setProductPhotos] = useState([]);
  const [editingStepId, setEditingStepId] = useState(null);

  const handleProductPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.slice(0, 3).map((file) => {
      // En fazla 3 fotoğraf
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve({ name: file.name, src: e.target.result, type: file.type });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((newPhotos) => {
      setProductPhotos(newPhotos);
    });
  };

  const deleteProductPhoto = (index) => {
    setProductPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e, isPartImage = false) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve({ name: file.name, src: e.target.result, type: file.type });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((newImages) => {
      if (isPartImage) {
        setPartImages((prevImages) => [
          ...prevImages,
          ...newImages.map((img) => ({ ...img, description: "" })),
        ]);
      } else {
        setImages((prevImages) => [...prevImages, ...newImages]);
      }
    });
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setCurrentStep({ ...currentStep, image });
  };

  const handleDescriptionChange = (e) => {
    setCurrentStep((prev) => ({ ...prev, description: e.target.value }));
  };

  const handlePartImageDescriptionChange = (index, description) => {
    setPartImages((prevImages) =>
      prevImages.map((img, i) => (i === index ? { ...img, description } : img))
    );
  };

  const saveStep = () => {
    if (currentStep.image && currentStep.description) {
      if (editingStepId !== null) {
        // Eğer düzenleme modundaysak, mevcut adımı güncelle
        saveEditedStep();
      } else {
        // Yeni adım ekleme
        setSteps((prevSteps) => [
          ...prevSteps,
          { ...currentStep, id: Date.now() },
        ]);
        setCurrentStep({ image: null, description: "" });
        setSelectedImage(null);
      }
    }
  };

  const deleteStep = (stepId) => {
    setSteps((prevSteps) => prevSteps.filter((step) => step.id !== stepId));
  };

  const startEditingStep = (stepId) => {
    const stepToEdit = steps.find((step) => step.id === stepId);
    if (stepToEdit) {
      setEditingStepId(stepId);
      setCurrentStep(stepToEdit);
      setSelectedImage(stepToEdit.image);
    }
  };

  const saveEditedStep = () => {
    if (editingStepId !== null) {
      setSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === editingStepId
            ? { ...currentStep, id: editingStepId }
            : step
        )
      );
      setEditingStepId(null);
      setCurrentStep({ image: null, description: "" });
      setSelectedImage(null);
    }
  };

  const deletePartImage = (index) => {
    setPartImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const PDFDocument = ({ productCode, partImages, steps }) => (
    <Document>
      {/* Ürün Kodu Sayfası */}
      <Page size="A4" style={styles.page}>
        <View style={styles.productCodePage}>
          <Text style={styles.productCode}>{productCode}</Text>
          <View style={styles.productPhotosContainer}>
            {productPhotos.map((photo, index) => (
              <Image key={index} src={photo.src} style={styles.productPhoto} />
            ))}
          </View>
        </View>
      </Page>

      {/* Parçalar Sayfası */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>1. Parçalar</Text>
        <View style={styles.partContainer}>
          {partImages.map((part, index) => (
            <View key={index} style={styles.part}>
              <Image src={part.src} style={styles.partImage} />
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
        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer} wrap={false}>
            <View style={styles.stepContent}>
              <View style={styles.stepText}>
                <Text style={styles.stepNumber}>{index + 1}. Adım</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
              <Image src={step.image.src} style={styles.stepImage} />
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );

  const [isPDFVisible, setIsPDFVisible] = useState(false);

  const handleCreatePDF = () => {
    setIsPDFVisible(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <label htmlFor="productCode" className="text-xl font-bold mb-2">
          Ürün Kodu:
        </label>
        <input
          type="text"
          id="productCode"
          value={productCode}
          onChange={(e) => setProductCode(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div className="flex flex-wrap -mx-2">
        <div className="w-full md:w-1/2 px-2 mb-4">
          <div className="mb-4 h-14 flex items-center">
            {" "}
            {/* Sabit yükseklik ve flex eklendi */}
            <input
              type="file"
              onChange={handleProductPhotoUpload}
              multiple
              accept="image/*"
              className="hidden"
              id="productPhotoInput"
            />
            <label
              htmlFor="productPhotoInput"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer inline-block" // inline-block eklendi
            >
              Ürün Fotoğraflarını Yükle
            </label>
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">
              Yüklenen Ürün Fotoğrafları:
            </h2>
            <div className="flex flex-wrap">
              {productPhotos.map((photo, index) => (
                <div key={index} className="relative m-2">
                  <img
                    src={photo.src}
                    alt={photo.name}
                    className="w-24 h-24 object-cover"
                  />
                  <button
                    onClick={() => deleteProductPhoto(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 px-2 mb-4">
          <div className="mb-4 h-14 flex items-center">
            {" "}
            {/* Sabit yükseklik ve flex eklendi */}
            <input
              type="file"
              ref={partFileInputRef}
              onChange={(e) => handleImageUpload(e, true)}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => partFileInputRef.current.click()}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-block" // inline-block eklendi
            >
              Parça Fotoğraflarını Yükle
            </button>
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">
              Yüklenen Parça Fotoğrafları:
            </h2>
            <div className="flex flex-wrap">
              {partImages.map((image, index) => (
                <div key={index} className="relative m-2 ">
                  <img
                    src={image.src}
                    alt={image.name}
                    className="w-24 h-24 object-cover"
                  />
                  <input
                    type="text"
                    value={image.description}
                    onChange={(e) =>
                      handlePartImageDescriptionChange(index, e.target.value)
                    }
                    placeholder="Parça açıklaması"
                    className="mt-2 w-24 p-2 border rounded"
                  />
                  <button
                    onClick={() => deletePartImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        multiple
        accept="image/*"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current.click()}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Adım Resimleri Yükle
      </button>

      <div className="flex flex-wrap mt-4">
        {images.map((image, index) => (
          <img
            key={index}
            src={image.src}
            alt={image.name}
            className="w-24 h-24 object-cover m-2 cursor-pointer"
            onClick={() => handleImageSelect(image)}
          />
        ))}
      </div>
      {selectedImage && (
        <div className="mt-4">
          <img
            src={selectedImage.src}
            alt={selectedImage.name}
            className="w-auto h-64 object-cover"
          />
          <textarea
            value={currentStep.description}
            onChange={handleDescriptionChange}
            placeholder="Açıklama yazın..."
            className="w-full mt-2 p-2 border rounded h-24"
          />
          <button
            onClick={saveStep}
            className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {editingStepId !== null ? "Değişiklikleri Kaydet" : "Adımı Kaydet"}
          </button>
        </div>
      )}

      <div className="mt-4">
        <h2 className="text-xl font-bold mb-4">Kaydedilen Adımlar:</h2>
        {steps.map((step, index) => (
          <div key={step.id} className="mt-2 border p-4 rounded relative">
            <div className="flex items-start pr-24">
              <img
                src={step.image.src}
                alt={step.image.name}
                className="w-24 h-24 object-cover mr-4 flex-shrink-0"
              />
              <div className="flex-grow">
                <p className="font-bold mb-1">{index + 1}. Adım</p>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {step.description}
                </p>
              </div>
            </div>
            <div className="absolute top-2 right-2 flex flex-col space-y-2">
              <button
                onClick={() => deleteStep(step.id)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
              >
                Sil
              </button>
              <button
                onClick={() => startEditingStep(step.id)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
              >
                Düzenle
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleCreatePDF}
        className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        PDF Oluştur ve Görüntüle
      </button>

      {isPDFVisible && (
        <PDFViewer width="100%" height={600} className="mt-4">
          <PDFDocument
            productCode={productCode}
            productPhotos={productPhotos}
            partImages={partImages}
            steps={steps}
          />
        </PDFViewer>
      )}
    </div>
  );
}
