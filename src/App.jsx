import { useState, useRef, useEffect } from 'react';

// Main application component
export default function App() {
  // ... (All your existing state and functions remain the same) ...
  const [image, setImage] = useState(null);
  const [base64ImageData, setBase64ImageData] = useState(null);
  const [slideContent, setSlideContent] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (base64ImageData) {
      generateSlideContent();
    }
  }, [base64ImageData]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setStatus('idle');
    setSlideContent(null);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setBase64ImageData(e.target.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const generateSlideContent = async () => {
    // ... (This entire function's logic is unchanged)
    if (!base64ImageData) {
        console.error("No image data available.");
        return;
      }
  
      setStatus('loading');
  
      const prompt = `You are an expert presentation creator. Analyze the following image and generate content for a single PowerPoint slide. Provide a concise, impactful title and 3-5 key bullet points that summarize the main theme or message of the image. The tone should be professional and informative. Respond with a JSON object.`;
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  contents: [
                      {
                          role: "user",
                          parts: [
                              { text: prompt },
                              { inlineData: { mimeType: "image/jpeg", data: base64ImageData } }
                          ]
                      }
                  ],
                  generationConfig: {
                      responseMimeType: "application/json",
                      responseSchema: {
                          type: "OBJECT",
                          properties: {
                              "title": { "type": "STRING" },
                              "bulletPoints": {
                                  "type": "ARRAY",
                                  "items": { "type": "STRING" }
                              }
                          },
                          required: ["title", "bulletPoints"]
                      }
                  }
              })
          });
  
          if (!response.ok) {
              throw new Error(`API request failed with status ${response.status}`);
          }
  
          const result = await response.json();
          
          if (result.candidates?.[0]?.content?.parts?.[0]) {
              const jsonText = result.candidates[0].content.parts[0].text;
              const parsedJson = JSON.parse(jsonText);
              setSlideContent(parsedJson);
              setStatus('success');
          } else {
              throw new Error('Unexpected API response structure.');
          }
  
      } catch (error) {
          console.error('Error generating content:', error);
          setError(`An error occurred: ${error.message}`);
          setStatus('error');
      }
  };

  const copyContentToClipboard = async () => {
    // ... (This function's logic is unchanged)
    if (!slideContent) return;

    const { title, bulletPoints } = slideContent;
    const textToCopy = `Title:\n${title}\n\nBullet Points:\n${bulletPoints.map(p => `- ${p}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowToast(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setError('Could not copy text to clipboard.');
      setStatus('error');
    }
  };


  // The JSX that renders the UI
  return (
    <div className="flex items-center justify-center min-h-screen p-4 text-slate-100">
      {/* The Glassmorphism Card */}
      <div className="w-full max-w-4xl mx-auto rounded-2xl bg-slate-800/60 p-6 md:p-8 shadow-2xl shadow-black/40 border border-slate-700/80 backdrop-blur-lg">
        
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            PPT Slide Generator
          </h1>
          <p className="text-slate-400 mt-2">Upload an image to manifest slide content with AI.</p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column: Image Uploader */}
          <div className="flex flex-col items-center justify-between bg-slate-900/50 p-6 rounded-xl border border-dashed border-slate-600 hover:border-slate-500 transition-colors">
            <div className="w-full h-64 flex items-center justify-center relative">
              {image ? (
                <img src={image} alt="Preview" className="max-w-full max-h-full rounded-lg object-contain" />
              ) : (
                <div className="text-center text-slate-500">
                   <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                   <p className="mt-2">Image preview will appear here</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)]"
            >
              Upload Image
            </button>
          </div>

          {/* Right Column: Generated Content */}
          <div className="flex flex-col">
            <div className="flex-grow bg-slate-900/50 p-6 rounded-xl min-h-[20rem] flex items-center justify-center border border-slate-800">
              {/* Conditional rendering based on status */}
              {status === 'loading' && <Spinner />}
              {status === 'error' && <ErrorMessage message={error} />}
              {status === 'success' && slideContent && <SuccessContent content={slideContent} />}
              {status === 'idle' && <Placeholder />}
            </div>
            <button 
              onClick={copyContentToClipboard}
              disabled={status !== 'success'}
              className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all duration-300 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]"
            >
              Copy Content
            </button>
          </div>
        </main>
      </div>
      
      <Toast show={showToast} message="Content copied to clipboard!" />
    </div>
  );
}

// --- Helper Components ---
// We'll update the styles of these components slightly

const Spinner = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <div className="spinner w-12 h-12 rounded-full border-4 border-slate-200/20"></div>
    <p className="mt-4 text-lg">Generating content, please wait...</p>
  </div>
);

const ErrorMessage = ({ message }) => (
    <div className="text-center text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="mt-2">{message}</p>
    </div>
);

const SuccessContent = ({ content }) => (
  <div className="w-full text-slate-200">
    <h2 className="text-2xl font-bold mb-4 text-slate-100">{content.title}</h2>
    <ul className="list-disc list-outside pl-5 space-y-2 text-slate-300">
      {content.bulletPoints.map((point, index) => (
        <li key={index}>{point}</li>
      ))}
    </ul>
  </div>
);

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <p className="mt-2 text-center">Generated slide content will appear here.</p>
    </div>
);

const Toast = ({ show, message }) => (
  <div 
    className={`fixed bottom-5 right-5 bg-slate-900/80 border border-slate-700 text-white py-2 px-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
  >
    {message}
  </div>
);