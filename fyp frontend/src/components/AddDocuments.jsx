// // // import React, { useState, useRef } from 'react'
// // // import Tesseract from 'tesseract.js'
// // // import './AddDocuments.css'

// // // const AddDocuments = ({ taskId }) => {
// // //     const fileInputRef = useRef(null)
// // //     const [activeDocId, setActiveDocId] = useState(null)

// // //     // State to track files for each document type
// // //     // State to track files for each document type
// // //     const [documents, setDocuments] = useState([
// // //         { id: 'cnic_front', label: 'CNIC Front', type: 'upload', files: [] },
// // //         { id: 'cnic_back', label: 'CNIC Back', type: 'upload', files: [] },
// // //         { id: 'lease_sale', label: 'Lease Paper / Sale Deed', type: 'upload', files: [] },
// // //         { id: 'kbc', label: 'KBC', type: 'upload', files: [] },
// // //         { id: 'transfer_letter', label: 'Transfer Letter', type: 'upload', files: [] },
// // //         { id: 'site_plan', label: 'Site Plan', type: 'upload', files: [] },
// // //         { id: 'demarcation', label: 'Demarcation Letter', type: 'upload', files: [] },
// // //         { id: 'allotment', label: 'Allotment Paper', type: 'upload', files: [] },
// // //         { id: 'position', label: 'Possession Letter', type: 'upload', files: [] } // Corrected spelling 'Position' to 'Possession' usually, but keeping user intent if 'Position' was strictly requested? User said 'position letter' but likely means 'Possession'. I will use 'Possession/Position' or just 'Possession Letter'. User text said 'position letter', but standard RE term is Possession. I will use 'Possession Letter'.
// // //     ])

// // //     const handleAddClick = (id) => {
// // //         setActiveDocId(id)
// // //         if (fileInputRef.current) {
// // //             fileInputRef.current.value = '' // Reset input to allow re-selecting same files
// // //             fileInputRef.current.click()
// // //         }
// // //     }

// // //     const handleFileChange = async (e) => {
// // //         const selectedFiles = Array.from(e.target.files)
// // //         if (!selectedFiles.length || !activeDocId) return

// // //         // Create new file entries
// // //         const newFileEntries = selectedFiles.map(file => ({
// // //             id: Date.now() + Math.random(), // temp unique id
// // //             name: file.name,
// // //             status: 'scanning',
// // //             text: null
// // //         }))

// // //         // Add to state immediately as 'scanning'
// // //         setDocuments(docs => docs.map(doc =>
// // //             doc.id === activeDocId
// // //                 ? { ...doc, files: [...doc.files, ...newFileEntries] }
// // //                 : doc
// // //         ))

// // //         // Process OCR for each file
// // //         for (let i = 0; i < selectedFiles.length; i++) {
// // //             const file = selectedFiles[i]
// // //             const fileId = newFileEntries[i].id

// // //             try {
// // //                 console.log(`Starting OCR for ${file.name}...`)
// // //                 const result = await Tesseract.recognize(
// // //                     file,
// // //                     'eng',
// // //                     { logger: m => console.log(m) }
// // //                 )

// // //                 console.log(`OCR Result for ${file.name}:`, result.data.text)

// // //                 // Update status to uploaded and save text
// // //                 setDocuments(docs => docs.map(doc => {
// // //                     if (doc.id === activeDocId) {
// // //                         return {
// // //                             ...doc,
// // //                             files: doc.files.map(f =>
// // //                                 f.id === fileId ? { ...f, status: 'uploaded', text: result.data.text } : f
// // //                             )
// // //                         }
// // //                     }
// // //                     return doc
// // //                 }))
// // //             } catch (error) {
// // //                 console.error(`OCR Error for ${file.name}:`, error)
// // //                 // Update status to error
// // //                 setDocuments(docs => docs.map(doc => {
// // //                     if (doc.id === activeDocId) {
// // //                         return {
// // //                             ...doc,
// // //                             files: doc.files.map(f =>
// // //                                 f.id === fileId ? { ...f, status: 'error' } : f
// // //                             )
// // //                         }
// // //                     }
// // //                     return doc
// // //                 }))
// // //             }
// // //         }

// // //         setActiveDocId(null)
// // //     }

// // //     const handleRemoveFile = (docId, fileId) => {
// // //         setDocuments(docs => docs.map(doc => {
// // //             if (doc.id === docId) {
// // //                 return {
// // //                     ...doc,
// // //                     files: doc.files.filter(f => f.id !== fileId)
// // //                 }
// // //             }
// // //             return doc
// // //         }))
// // //     }

// // //     const handleCheck = (id) => {
// // //         setDocuments(docs => docs.map(doc =>
// // //             doc.id === id ? { ...doc, status: doc.status === 'checked' ? 'unchecked' : 'checked' } : doc
// // //         ))
// // //     }

// // //     return (
// // //         <div className="add-documents-page">
// // //             <div className="add-documents-container">
// // //                 <h1 className="text-gradient mb-6">Add Documents</h1>

// // //                 {/* Hidden File Input */}
// // //                 <input
// // //                     type="file"
// // //                     ref={fileInputRef}
// // //                     style={{ display: 'none' }}
// // //                     accept="image/*"
// // //                     /* Enable multiple files unless it is CNIC Front/Back */
// // //                     multiple={activeDocId !== 'cnic_front' && activeDocId !== 'cnic_back'}
// // //                     onChange={handleFileChange}
// // //                 />

// // //                 <div className="documents-list">
// // //                     {documents.map((doc) => (
// // //                         <div key={doc.id} className="document-item-wrapper">
// // //                             <div className="document-header">
// // //                                 <span className="document-label">{doc.label}</span>
// // //                                 <div className="document-action">
// // //                                     {doc.type === 'upload' ? (
// // //                                         <button
// // //                                             className="btn-primary btn-small"
// // //                                             onClick={() => handleAddClick(doc.id)}
// // //                                         >
// // //                                             {doc.id === 'cnic_front' || doc.id === 'cnic_back' ? '+ Add Image' : '+ Add Images'}
// // //                                         </button>
// // //                                     ) : (
// // //                                         <label className="checkbox-container">
// // //                                             <input
// // //                                                 type="checkbox"
// // //                                                 checked={doc.status === 'checked'}
// // //                                                 onChange={() => handleCheck(doc.id)}
// // //                                             />
// // //                                             <span className="checkmark"></span>
// // //                                         </label>
// // //                                     )}
// // //                                 </div>
// // //                             </div>

// // //                             {/* Uploaded Files List */}
// // //                             {doc.type === 'upload' && doc.files.length > 0 && (
// // //                                 <div className="uploaded-files-list">
// // //                                     {doc.files.map(file => (
// // //                                         <div key={file.id} className="file-item">
// // //                                             <div className="file-info">
// // //                                                 <span className="file-icon">📄</span>
// // //                                                 <span className="file-name">{file.name}</span>
// // //                                             </div>
// // //                                             <div className="file-actions">
// // //                                                 {file.status === 'scanning' && <span className="status-scanning">Scanning...</span>}
// // //                                                 {file.status === 'uploaded' && <span className="status-success">✓ Ready</span>}
// // //                                                 {file.status === 'error' && <span className="status-error">Failed</span>}

// // //                                                 <button
// // //                                                     className="remove-file-btn"
// // //                                                     onClick={() => handleRemoveFile(doc.id, file.id)}
// // //                                                     title="Remove"
// // //                                                 >
// // //                                                     &times;
// // //                                                 </button>
// // //                                             </div>
// // //                                         </div>
// // //                                     ))}
// // //                                 </div>
// // //                             )}
// // //                         </div>
// // //                     ))}
// // //                 </div>
// // //             </div>

// // //             <div className="form-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', paddingBottom: '30px' }}>
// // //                 <button
// // //                     className="btn-primary"
// // //                     style={{ padding: '12px 30px', fontSize: '1rem', fontWeight: 'bold' }}
// // //                     onClick={() => {
// // //                         const uploadedDocs = [];
// // //                         documents.forEach(doc => {
// // //                             doc.files.forEach(file => {
// // //                                 if (file.status === 'uploaded') {
// // //                                     uploadedDocs.push({
// // //                                         name: file.name,
// // //                                         status: 'Pending'
// // //                                     });
// // //                                 }
// // //                             });
// // //                         });

// // //                         if (uploadedDocs.length > 0) {
// // //                             const storageKey = `task_documents_${taskId}`;
// // //                             const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
// // //                             const updatedDocs = [...existingDocs, ...uploadedDocs];
// // //                             localStorage.setItem(storageKey, JSON.stringify(updatedDocs));

// // //                             // Notify AgentTaskDetails to refresh
// // //                             window.dispatchEvent(new CustomEvent('documentsUpdated', { detail: { taskId } }));

// // //                             alert('Documents Uploaded Successfully!');
// // //                         } else {
// // //                             alert('No new documents to upload.');
// // //                         }
// // //                     }}
// // //                 >
// // //                     Upload Document
// // //                 </button>
// // //             </div>
// // //         </div>

// // //     )
// // // }

// // // export default AddDocuments


// // import React, { useState, useRef } from 'react'
// // import Tesseract from 'tesseract.js'
// // import './AddDocuments.css'

// // const AddDocuments = ({ taskId, propertyId }) => {
// //     const fileInputRef = useRef(null)
// //     const [activeDocId, setActiveDocId] = useState(null)

// //     // State to track files for each document type
// //     // State to track files for each document type
// //     const [documents, setDocuments] = useState([
// //         { id: 'cnic_front', label: 'CNIC Front', type: 'upload', files: [] },
// //         { id: 'cnic_back', label: 'CNIC Back', type: 'upload', files: [] },
// //         { id: 'lease_sale', label: 'Lease Paper / Sale Deed', type: 'upload', files: [] },
// //         { id: 'kbc', label: 'KBC', type: 'upload', files: [] },
// //         { id: 'transfer_letter', label: 'Transfer Letter', type: 'upload', files: [] },
// //         { id: 'site_plan', label: 'Site Plan', type: 'upload', files: [] },
// //         { id: 'demarcation', label: 'Demarcation Letter', type: 'upload', files: [] },
// //         { id: 'allotment', label: 'Allotment Paper', type: 'upload', files: [] },
// //         { id: 'position', label: 'Possession Letter', type: 'upload', files: [] } // Corrected spelling 'Position' to 'Possession' usually, but keeping user intent if 'Position' was strictly requested? User said 'position letter' but likely means 'Possession'. I will use 'Possession Letter'.
// //     ])

// //     const handleAddClick = (id) => {
// //         setActiveDocId(id)
// //         if (fileInputRef.current) {
// //             fileInputRef.current.value = '' // Reset input to allow re-selecting same files
// //             fileInputRef.current.click()
// //         }
// //     }

// //     const handleFileChange = async (e) => {
// //         const selectedFiles = Array.from(e.target.files)
// //         if (!selectedFiles.length || !activeDocId) return

// //         // Create new file entries
// //         const newFileEntries = selectedFiles.map(file => ({
// //             id: Date.now() + Math.random(), // temp unique id
// //             name: file.name,
// //             status: 'scanning',
// //             text: null,
// //             file: file
// //         }))

// //         // Add to state immediately as 'scanning'
// //         setDocuments(docs => docs.map(doc =>
// //             doc.id === activeDocId
// //                 ? { ...doc, files: [...doc.files, ...newFileEntries] }
// //                 : doc
// //         ))

// //         // Process OCR for each file
// //         for (let i = 0; i < selectedFiles.length; i++) {
// //             const file = selectedFiles[i]
// //             const fileId = newFileEntries[i].id

// //             try {
// //                 console.log(`Starting OCR for ${file.name}...`)
// //                 const result = await Tesseract.recognize(
// //                     file,
// //                     'eng',
// //                     { logger: m => console.log(m) }
// //                 )

// //                 console.log(`OCR Result for ${file.name}:`, result.data.text)

// //                 // Update status to uploaded and save text
// //                 setDocuments(docs => docs.map(doc => {
// //                     if (doc.id === activeDocId) {
// //                         return {
// //                             ...doc,
// //                             files: doc.files.map(f =>
// //                                 f.id === fileId ? { ...f, status: 'uploaded', text: result.data.text } : f
// //                             )
// //                         }
// //                     }
// //                     return doc
// //                 }))
// //             } catch (error) {
// //                 console.error(`OCR Error for ${file.name}:`, error)
// //                 // Update status to error
// //                 setDocuments(docs => docs.map(doc => {
// //                     if (doc.id === activeDocId) {
// //                         return {
// //                             ...doc,
// //                             files: doc.files.map(f =>
// //                                 f.id === fileId ? { ...f, status: 'error' } : f
// //                             )
// //                         }
// //                     }
// //                     return doc
// //                 }))
// //             }
// //         }

// //         setActiveDocId(null)
// //     }

// //     const handleRemoveFile = (docId, fileId) => {
// //         setDocuments(docs => docs.map(doc => {
// //             if (doc.id === docId) {
// //                 return {
// //                     ...doc,
// //                     files: doc.files.filter(f => f.id !== fileId)
// //                 }
// //             }
// //             return doc
// //         }))
// //     }

// //     const handleCheck = (id) => {
// //         setDocuments(docs => docs.map(doc =>
// //             doc.id === id ? { ...doc, status: doc.status === 'checked' ? 'unchecked' : 'checked' } : doc
// //         ))
// //     }

// //     return (
// //         <div className="add-documents-page">
// //             <div className="add-documents-container">
// //                 <h1 className="text-gradient mb-6">Add Documents</h1>

// //                 {/* Hidden File Input */}
// //                 <input
// //                     type="file"
// //                     ref={fileInputRef}
// //                     style={{ display: 'none' }}
// //                     accept="image/*"
// //                     /* Enable multiple files unless it is CNIC Front/Back */
// //                     multiple={activeDocId !== 'cnic_front' && activeDocId !== 'cnic_back'}
// //                     onChange={handleFileChange}
// //                 />

// //                 <div className="documents-list">
// //                     {documents.map((doc) => (
// //                         <div key={doc.id} className="document-item-wrapper">
// //                             <div className="document-header">
// //                                 <span className="document-label">{doc.label}</span>
// //                                 <div className="document-action">
// //                                     {doc.type === 'upload' ? (
// //                                         <button
// //                                             className="btn-primary btn-small"
// //                                             onClick={() => handleAddClick(doc.id)}
// //                                         >
// //                                             {doc.id === 'cnic_front' || doc.id === 'cnic_back' ? '+ Add Image' : '+ Add Images'}
// //                                         </button>
// //                                     ) : (
// //                                         <label className="checkbox-container">
// //                                             <input
// //                                                 type="checkbox"
// //                                                 checked={doc.status === 'checked'}
// //                                                 onChange={() => handleCheck(doc.id)}
// //                                             />
// //                                             <span className="checkmark"></span>
// //                                         </label>
// //                                     )}
// //                                 </div>
// //                             </div>

// //                             {/* Uploaded Files List */}
// //                             {doc.type === 'upload' && doc.files.length > 0 && (
// //                                 <div className="uploaded-files-list">
// //                                     {doc.files.map(file => (
// //                                         <div key={file.id} className="file-item">
// //                                             <div className="file-info">
// //                                                 <span className="file-icon">📄</span>
// //                                                 <span className="file-name">{file.name}</span>
// //                                             </div>
// //                                             <div className="file-actions">
// //                                                 {file.status === 'scanning' && <span className="status-scanning">Scanning...</span>}
// //                                                 {file.status === 'uploaded' && <span className="status-success">✓ Ready</span>}
// //                                                 {file.status === 'error' && <span className="status-error">Failed</span>}

// //                                                 <button
// //                                                     className="remove-file-btn"
// //                                                     onClick={() => handleRemoveFile(doc.id, file.id)}
// //                                                     title="Remove"
// //                                                 >
// //                                                     &times;
// //                                                 </button>
// //                                             </div>
// //                                         </div>
// //                                     ))}
// //                                 </div>
// //                             )}
// //                         </div>
// //                     ))}
// //                 </div>
// //             </div>

// //             <div className="form-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', paddingBottom: '30px' }}>
// //                 <button
// //                     className="btn-primary"
// //                     style={{ padding: '12px 30px', fontSize: '1rem', fontWeight: 'bold' }}
// //                     onClick={async () => {
// //                         const uploadPromises = [];
// //                         documents.forEach(doc => {
// //                             doc.files.forEach(file => {
// //                                 if (file.status === 'uploaded') {
// //                                     const formData = new FormData();
// //                                     formData.append('file', file.file);
// //                                     formData.append('property_id', propertyId);
// //                                     formData.append('document_type', doc.id);

// //                                     uploadPromises.push(
// //                                         fetch('http://127.0.0.1:8000/documents/upload/', {
// //                                             method: 'POST',
// //                                             headers: {
// //                                                 Authorization: `Bearer ${localStorage.getItem('access')}`
// //                                             },
// //                                             body: formData
// //                                         }).then(res => {
// //                                             if (!res.ok) {
// //                                                 return res.json().then(errData => {
// //                                                     throw new Error(errData.error || 'Upload failed');
// //                                                 });
// //                                             }
// //                                             return res.json();
// //                                         })
// //                                     );
// //                                 }
// //                             });
// //                         });

// //                         try {
// //                             await Promise.all(uploadPromises);
// //                             window.dispatchEvent(new CustomEvent('documentsUpdated', { detail: { taskId } }));
// //                             alert('Documents Uploaded Successfully!');
// //                             setDocuments(documents.map(doc => ({ ...doc, files: [] })));
// //                         } catch (error) {
// //                             alert('Error uploading documents: ' + error.message);
// //                         }
// //                     }}
// //                 >
// //                     Upload Document
// //                 </button>
// //             </div>
// //         </div>

// //     )
// // }

// // export default AddDocuments
// // AddDocuments.jsx
// // ── NO Tesseract / frontend OCR ──────────────────────────────────────────────
// // All OCR, classification, and validation happens on the Django backend.

// import React, { useState, useRef } from 'react'
// import './AddDocuments.css'

// const DOCUMENT_TYPES = [
//   { id: 'cnic_front',      label: 'CNIC Front',              single: true  },
//   { id: 'cnic_back',       label: 'CNIC Back',               single: true  },
//   { id: 'lease_sale',      label: 'Lease Paper / Sale Deed', single: false },
//   { id: 'kbc',             label: 'KBC',                     single: false },
//   { id: 'transfer_letter', label: 'Transfer Letter',         single: false },
//   { id: 'site_plan',       label: 'Site Plan',               single: false },
//   { id: 'demarcation',     label: 'Demarcation Letter',      single: false },
//   { id: 'allotment',       label: 'Allotment Letter',        single: false },
//   { id: 'possession',      label: 'Possession Letter',       single: false },
// ]

// const STATUS_LABEL = {
//   idle:       { text: '',             cls: ''                },
//   selected:   { text: '📎 Ready',    cls: 'status-selected' },
//   uploading:  { text: '⏳ Uploading…',cls: 'status-uploading'},
//   verified:   { text: '✅ Verified',  cls: 'status-verified' },
//   rejected:   { text: '❌ Rejected',  cls: 'status-rejected' },
//   failed:     { text: '⚠ Failed',    cls: 'status-failed'   },
// }

// const API_BASE = 'http://127.0.0.1:8000'

// // One slot per document type
// const makeSlots = () =>
//   Object.fromEntries(
//     DOCUMENT_TYPES.map(dt => [
//       dt.id,
//       { file: null, status: 'idle', rejectionReason: '', uploadProgress: 0 },
//     ])
//   )

// const AddDocuments = ({ taskId, propertyId }) => {
//   const [slots, setSlots]           = useState(makeSlots)
//   const [isSubmitting, setSubmitting] = useState(false)
//   const [globalMessage, setGlobalMessage] = useState(null)  // { type, text }
//   const fileInputRef                = useRef(null)
//   const activeDocIdRef              = useRef(null)

//   // ── File picker ────────────────────────────────────────────────────────────
//   const handleAddClick = (docId) => {
//     activeDocIdRef.current = docId
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ''
//       fileInputRef.current.click()
//     }
//   }

//   const handleFileChange = (e) => {
//     const file  = e.target.files?.[0]
//     const docId = activeDocIdRef.current
//     if (!file || !docId) return

//     setSlots(prev => ({
//       ...prev,
//       [docId]: { file, status: 'selected', rejectionReason: '', uploadProgress: 0 },
//     }))
//   }

//   const handleRemove = (docId) => {
//     setSlots(prev => ({
//       ...prev,
//       [docId]: { file: null, status: 'idle', rejectionReason: '', uploadProgress: 0 },
//     }))
//   }

//   // ── Upload all selected files ──────────────────────────────────────────────
//   const handleUpload = async () => {
//     const selected = DOCUMENT_TYPES.filter(dt => slots[dt.id].status === 'selected')

//     if (selected.length === 0) {
//       setGlobalMessage({ type: 'warn', text: 'Please select at least one document before uploading.' })
//       return
//     }

//     if (!propertyId) {
//       setGlobalMessage({ type: 'error', text: 'Property ID is missing. Cannot upload.' })
//       return
//     }

//     setSubmitting(true)
//     setGlobalMessage(null)

//     // Mark all selected as "uploading"
//     setSlots(prev => {
//       const next = { ...prev }
//       selected.forEach(dt => {
//         next[dt.id] = { ...next[dt.id], status: 'uploading' }
//       })
//       return next
//     })

//     const token = localStorage.getItem('access')

//     // Upload one at a time to avoid overwhelming the server
//     for (const dt of selected) {
//       const slot = slots[dt.id]
//       const formData = new FormData()
//       formData.append('file',          slot.file)
//       formData.append('property_id',   String(propertyId))
//       formData.append('document_type', dt.id)

//       try {
//         const response = await fetch(`${API_BASE}/documents/upload/`, {
//           method:  'POST',
//           headers: { Authorization: `Bearer ${token}` },
//           body:    formData,
//         })

//         const data = await response.json()

//         if (response.ok && data.status === 'verified') {
//           setSlots(prev => ({
//             ...prev,
//             [dt.id]: { ...prev[dt.id], status: 'verified', rejectionReason: '' },
//           }))
//         } else {
//           const reason = data.rejection_reason || data.error || 'Unknown error'
//           setSlots(prev => ({
//             ...prev,
//             [dt.id]: { ...prev[dt.id], status: 'rejected', rejectionReason: reason },
//           }))
//         }
//       } catch (err) {
//         setSlots(prev => ({
//           ...prev,
//           [dt.id]: {
//             ...prev[dt.id],
//             status:          'failed',
//             rejectionReason: 'Network error — please try again.',
//           },
//         }))
//       }
//     }

//     setSubmitting(false)

//     // Notify AgentTaskDetails to refresh the document list
//     window.dispatchEvent(new CustomEvent('documentsUpdated', { detail: { taskId } }))

//     // Summary message
//     const final = { ...slots }
//     const verifiedCount = selected.filter(dt => final[dt.id]?.status === 'verified').length
//     if (verifiedCount === selected.length) {
//       setGlobalMessage({ type: 'success', text: `All ${verifiedCount} document(s) verified and stored on blockchain.` })
//     } else {
//       setGlobalMessage({ type: 'warn', text: 'Some documents were rejected. Review the rejection reasons below.' })
//     }
//   }

//   // ── Render ─────────────────────────────────────────────────────────────────
//   const hasSelected = DOCUMENT_TYPES.some(dt => slots[dt.id].status === 'selected')

//   return (
//     <div className="add-documents-page">
//       <div className="add-documents-container">
//         <h1 className="text-gradient mb-6">Add Documents</h1>

//         <p className="upload-info-text">
//           Upload clear images of each document. The system will automatically verify
//           the document type using OCR and store it on the blockchain.
//         </p>

//         {/* Hidden file input */}
//         <input
//           type="file"
//           ref={fileInputRef}
//           style={{ display: 'none' }}
//           accept="image/jpeg,image/png,image/jpg,image/tiff,image/webp"
//           onChange={handleFileChange}
//         />

//         {/* Global status banner */}
//         {globalMessage && (
//           <div className={`global-message global-message--${globalMessage.type}`}>
//             {globalMessage.text}
//           </div>
//         )}

//         {/* Document slots */}
//         <div className="documents-list">
//           {DOCUMENT_TYPES.map(dt => {
//             const slot  = slots[dt.id]
//             const label = STATUS_LABEL[slot.status] || STATUS_LABEL.idle

//             return (
//               <div key={dt.id} className={`document-item-wrapper ${slot.status !== 'idle' ? 'has-file' : ''}`}>
//                 <div className="document-header">
//                   <span className="document-label">{dt.label}</span>

//                   <div className="document-action">
//                     {slot.status === 'idle' || slot.status === 'selected' ? (
//                       <button
//                         className="btn-primary btn-small"
//                         onClick={() => handleAddClick(dt.id)}
//                         disabled={isSubmitting}
//                       >
//                         {slot.status === 'selected' ? '↺ Change' : '+ Add Image'}
//                       </button>
//                     ) : null}
//                   </div>
//                 </div>

//                 {/* File row */}
//                 {slot.file && (
//                   <div className={`file-item file-item--${slot.status}`}>
//                     <div className="file-info">
//                       <span className="file-icon">📄</span>
//                       <span className="file-name" title={slot.file.name}>
//                         {slot.file.name.length > 40
//                           ? slot.file.name.slice(0, 37) + '…'
//                           : slot.file.name}
//                       </span>
//                     </div>

//                     <div className="file-actions">
//                       {/* Status badge */}
//                       {label.text && (
//                         <span className={`file-status-badge ${label.cls}`}>
//                           {label.text}
//                         </span>
//                       )}

//                       {/* Uploading spinner */}
//                       {slot.status === 'uploading' && (
//                         <span className="spinner" aria-label="Uploading" />
//                       )}

//                       {/* Remove button — only when not mid-upload */}
//                       {slot.status !== 'uploading' && (
//                         <button
//                           className="remove-file-btn"
//                           onClick={() => handleRemove(dt.id)}
//                           title="Remove"
//                           disabled={isSubmitting}
//                         >
//                           ×
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {/* Rejection reason */}
//                 {slot.status === 'rejected' && slot.rejectionReason && (
//                   <div className="rejection-reason">
//                     <strong>Reason:</strong> {slot.rejectionReason}
//                   </div>
//                 )}
//               </div>
//             )
//           })}
//         </div>
//       </div>

//       {/* Submit button */}
//       <div className="form-actions">
//         <button
//           className="btn-primary btn-upload-all"
//           onClick={handleUpload}
//           disabled={isSubmitting || !hasSelected}
//         >
//           {isSubmitting ? (
//             <>
//               <span className="spinner spinner--inline" />
//               Uploading…
//             </>
//           ) : (
//             'Upload & Verify Documents'
//           )}
//         </button>
//       </div>
//     </div>
//   )
// }

// export default AddDocuments


// AddDocuments.jsx
// ── NO Tesseract / frontend OCR ──────────────────────────────────────────────
// All OCR, classification, and validation happens on the Django backend.

import React, { useState, useRef } from 'react'
import './AddDocuments.css'

const DOCUMENT_TYPES = [
  { id: 'cnic_front',      label: 'CNIC Front',              single: true  },
  // { id: 'cnic_back',       label: 'CNIC Back',               single: true  },
  // { id: 'lease_sale',      label: 'Lease Paper / Sale Deed', single: false },
  // { id: 'kbc',             label: 'KBC',                     single: false },
  { id: 'transfer_letter', label: 'Transfer Letter',         single: false },
  // { id: 'site_plan',       label: 'Site Plan',               single: false },
  { id: 'demarcation',     label: 'Demarcation Letter',      single: false },
  { id: 'allotment',       label: 'Allotment Letter',        single: false },
  { id: 'possession',      label: 'Possession Letter',       single: false },
]

const STATUS_LABEL = {
  idle:       { text: '',             cls: ''                },
  selected:   { text: '📎 Ready',    cls: 'status-selected' },
  uploading:  { text: '⏳ Uploading…',cls: 'status-uploading'},
  verified:   { text: '✅ Verified',  cls: 'status-verified' },
  rejected:   { text: '❌ Rejected',  cls: 'status-rejected' },
  failed:     { text: '⚠ Failed',    cls: 'status-failed'   },
}

const API_BASE = 'http://127.0.0.1:8000'

// One slot per document type
const makeSlots = () =>
  Object.fromEntries(
    DOCUMENT_TYPES.map(dt => [
      dt.id,
      { file: null, status: 'idle', rejectionReason: '', uploadProgress: 0 },
    ])
  )

const AddDocuments = ({ taskId, propertyId }) => {
  const [slots, setSlots]           = useState(makeSlots)
  const [isSubmitting, setSubmitting] = useState(false)
  const [globalMessage, setGlobalMessage] = useState(null)  // { type, text }
  const fileInputRef                = useRef(null)
  const activeDocIdRef              = useRef(null)

  // ── File picker ────────────────────────────────────────────────────────────
  const handleAddClick = (docId) => {
    activeDocIdRef.current = docId
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file  = e.target.files?.[0]
    const docId = activeDocIdRef.current
    if (!file || !docId) return

    setSlots(prev => ({
      ...prev,
      [docId]: { file, status: 'selected', rejectionReason: '', uploadProgress: 0 },
    }))
  }

  const handleRemove = (docId) => {
    setSlots(prev => ({
      ...prev,
      [docId]: { file: null, status: 'idle', rejectionReason: '', uploadProgress: 0 },
    }))
  }

  // ── Upload all selected files ──────────────────────────────────────────────
  const handleUpload = async () => {
    const selected = DOCUMENT_TYPES.filter(dt => slots[dt.id].status === 'selected')

    if (selected.length === 0) {
      setGlobalMessage({ type: 'warn', text: 'Please select at least one document before uploading.' })
      return
    }

    if (!propertyId) {
      setGlobalMessage({ type: 'error', text: 'Property ID is missing. Cannot upload.' })
      return
    }

    setSubmitting(true)
    setGlobalMessage(null)

    // Mark all selected as "uploading"
    setSlots(prev => {
      const next = { ...prev }
      selected.forEach(dt => {
        next[dt.id] = { ...next[dt.id], status: 'uploading' }
      })
      return next
    })

    const token = localStorage.getItem('access')

    // Upload one at a time to avoid overwhelming the server
    for (const dt of selected) {
      const slot = slots[dt.id]
      const formData = new FormData()
      formData.append('file',          slot.file)
      formData.append('property_id',   String(propertyId))
      formData.append('document_type', dt.id)

      try {
        const response = await fetch(`${API_BASE}/documents/upload/`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
          body:    formData,
        })

        const data = await response.json()

        if (response.ok && data.status === 'verified') {
          setSlots(prev => ({
            ...prev,
            [dt.id]: { ...prev[dt.id], status: 'verified', rejectionReason: '' },
          }))
        } else {
          const reason = data.rejection_reason || data.error || 'Unknown error'
          setSlots(prev => ({
            ...prev,
            [dt.id]: { ...prev[dt.id], status: 'rejected', rejectionReason: reason },
          }))
        }
      } catch (err) {
        setSlots(prev => ({
          ...prev,
          [dt.id]: {
            ...prev[dt.id],
            status:          'failed',
            rejectionReason: 'Network error — please try again.',
          },
        }))
      }
    }

    setSubmitting(false)

    // Notify AgentTaskDetails to refresh the document list
    window.dispatchEvent(new CustomEvent('documentsUpdated', { detail: { taskId } }))

    // Summary message
    const final = { ...slots }
    const verifiedCount = selected.filter(dt => final[dt.id]?.status === 'verified').length
    if (verifiedCount === selected.length) {
      setGlobalMessage({ type: 'success', text: `All ${verifiedCount} document(s) verified and stored on blockchain.` })
    } else {
      setGlobalMessage({ type: 'warn', text: 'Some documents were rejected. Review the rejection reasons below.' })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const hasSelected = DOCUMENT_TYPES.some(dt => slots[dt.id].status === 'selected')

  return (
    <div className="add-documents-page">
      <div className="add-documents-container">
        <h1 className="text-gradient mb-6">Add Documents</h1>

        <p className="upload-info-text">
          Upload clear images of each document. The system will automatically verify
          the document type using OCR and store it on the blockchain.
        </p>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/jpeg,image/png,image/jpg,image/tiff,image/webp"
          onChange={handleFileChange}
        />

        {/* Global status banner */}
        {globalMessage && (
          <div className={`global-message global-message--${globalMessage.type}`}>
            {globalMessage.text}
          </div>
        )}

        {/* Document slots */}
        <div className="documents-list">
          {DOCUMENT_TYPES.map(dt => {
            const slot  = slots[dt.id]
            const label = STATUS_LABEL[slot.status] || STATUS_LABEL.idle

            return (
              <div key={dt.id} className={`document-item-wrapper ${slot.status !== 'idle' ? 'has-file' : ''}`}>
                <div className="document-header">
                  <span className="document-label">{dt.label}</span>

                  <div className="document-action">
                    {slot.status === 'idle' || slot.status === 'selected' ? (
                      <button
                        className="btn-primary btn-small"
                        onClick={() => handleAddClick(dt.id)}
                        disabled={isSubmitting}
                      >
                        {slot.status === 'selected' ? '↺ Change' : '+ Add Image'}
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* File row */}
                {slot.file && (
                  <div className={`file-item file-item--${slot.status}`}>
                    <div className="file-info">
                      <span className="file-icon">📄</span>
                      <span className="file-name" title={slot.file.name}>
                        {slot.file.name.length > 40
                          ? slot.file.name.slice(0, 37) + '…'
                          : slot.file.name}
                      </span>
                    </div>

                    <div className="file-actions">
                      {/* Status badge */}
                      {label.text && (
                        <span className={`file-status-badge ${label.cls}`}>
                          {label.text}
                        </span>
                      )}

                      {/* Uploading spinner */}
                      {slot.status === 'uploading' && (
                        <span className="spinner" aria-label="Uploading" />
                      )}

                      {/* Remove button — only when not mid-upload */}
                      {slot.status !== 'uploading' && (
                        <button
                          className="remove-file-btn"
                          onClick={() => handleRemove(dt.id)}
                          title="Remove"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection reason */}
                {slot.status === 'rejected' && slot.rejectionReason && (
                  <div className="rejection-reason">
                    <strong>Reason:</strong> {slot.rejectionReason}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Submit button */}
      <div className="form-actions">
        <button
          className="btn-primary btn-upload-all"
          onClick={handleUpload}
          disabled={isSubmitting || !hasSelected}
        >
          {isSubmitting ? (
            <>
              <span className="spinner spinner--inline" />
              Uploading…
            </>
          ) : (
            'Upload & Verify Documents'
          )}
        </button>
      </div>
    </div>
  )
}

export default AddDocuments
