import { useState, useRef, useEffect } from 'react';

// Main application component
export default function App() {
  // State management using React Hooks
  const [image, setImage] = useState(null); // Stores the image data URL for preview
  const [base64ImageData, setBase64ImageData] = useState(null); // Stores base64 data for API
  const [slideContent, setSlideContent] = useState(null); // Stores API response {title, bulletPoints}
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [error, setError] = useState(''); // Stores error messages
  const [showToast, setShowToast] = useState(false); // Controls toast visibility

  // A ref to access the hidden file input element
  const fileInputRef = useRef(null);

  // Effect to automatically call the API when an image is selected
  useEffect(() => {
    if (base64ImageData) {
      generateSlideContent();
    }
  }, [base64ImageData]);

  // Effect to hide the toast notification after 2 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer); // Cleanup timer on component unmount
    }
  }, [showToast]);

  /**
   * Handles the file input change event. Reads the selected image,
   * sets state for preview and API call.
   */
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset UI for new image
    setStatus('idle');
    setSlideContent(null);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result); // For <img src>
      setBase64ImageData(e.target.result.split(',')[1]); // For API
    };
    reader.readAsDataURL(file);
  };

  /**
   * Sends the image data to the Gemini API to generate slide content.
   */
  const generateSlideContent = async () => {
    if (!base64ImageData) {
      console.error("No image data available.");
      return;
    }

    setStatus('loading');

    const prompt = `You are an expert presentation creator. Analyze the following image and generate content for a single PowerPoint slide. Provide a concise, impactful title and 3-5 key bullet points that summarize the main theme or message of the image. The tone should be professional and informative. Respond with a JSON object.`;
    
    const payload = { /* ... (payload remains the same as original) ... */ };
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Using environment variable
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // ... [The rest of the 'generateSlideContent' function is nearly identical to your original JS]
    // Just replace DOM manipulation with state updates:
    // - On success: setSlideContent(parsedJson); setStatus('success');
    // - On error: setError(message); setStatus('error');
    // - In finally: setStatus will already be 'success' or 'error', no need for a final 'hide loader'.
    
    // This is a simplified version of the fetch call for brevity.
    // The full payload and error handling should be as in your original file.
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

  /**
   * Copies the generated slide content to the clipboard using the modern Clipboard API.
   */
  const copyContentToClipboard = async () => {
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
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8">
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">PPT Slide Generator</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Upload an image to automatically generate slide content.</p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column: Image Uploader */}
          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="w-full h-64 flex items-center justify-center relative">
              {image ? (
                <img src={image} alt="Preview" className="max-w-full max-h-full rounded-lg object-contain" />
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
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
              className="mt-4 w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              Upload Image
            </button>
          </div>

          {/* Right Column: Generated Content */}
          <div className="flex flex-col">
            <div className="flex-grow bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl min-h-[20rem] flex items-center justify-center">
              {/* Conditional rendering based on status */}
              {status === 'loading' && <Spinner />}
              {status === 'error' && <ErrorMessage message={error} />}
              {status === 'success' && slideContent && <SuccessContent content={slideContent} />}
              {status === 'idle' && <Placeholder />}
            </div>
            <button 
              onClick={copyContentToClipboard}
              disabled={status !== 'success'}
              className="mt-4 w-full bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-gray-800 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Copy Content
            </button>
          </div>
        </main>
      </div>
      
      {/* Toast Notification */}
      <Toast show={showToast} message="Content copied to clipboard!" />
    </div>
  );
}

// --- Helper Components ---

const Spinner = () => (
  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
    <div className="spinner w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-600"></div>
    <p className="mt-4 text-lg">Generating content, please wait...</p>
  </div>
);

const ErrorMessage = ({ message }) => (
    <div className="text-center text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="mt-2">{message}</p>
    </div>
);

const SuccessContent = ({ content }) => (
  <div className="prose dark:prose-invert max-w-none w-full">
    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{content.title}</h2>
    <ul className="list-disc pl-5 space-y-2">
      {content.bulletPoints.map((point, index) => (
        <li key={index}>{point}</li>
      ))}
    </ul>
  </div>
);

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <p className="mt-2 text-center">Generated slide content will appear here.</p>
    </div>
);

const Toast = ({ show, message }) => (
  <div 
    className={`fixed bottom-5 right-5 bg-gray-900 text-white py-2 px-4 rounded-lg shadow-lg transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
  >
    {message}
  </div>
);