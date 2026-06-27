// src/pages/CertificatePage.jsx — Course completion certificate generator
import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import { LoadingSpinner } from "../components/common/UIComponents";
import { FiDownload, FiArrowLeft, FiAward } from "react-icons/fi";

const CertificatePage = () => {
  const { id } = useParams(); // courseId
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const certRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollRes, courseRes] = await Promise.all([
          API.get(`/enrollments/${id}`),
          API.get(`/courses/${id}`),
        ]);
        setEnrollment(enrollRes.data.enrollment);
        setCourse(courseRes.data.course);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownload = () => {
    const cert = certRef.current;
    if (!cert) return;

    // Print/Save as PDF
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${course?.title}</title>
          <style>
            body { margin: 0; padding: 0; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${cert.outerHTML}
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const completionDate = enrollment?.completedAt
    ? new Date(enrollment.completedAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric"
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric"
      });

  if (loading) return <LoadingSpinner center />;

  if (!enrollment?.isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <FiAward size={60} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Certificate Not Available Yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            Complete all videos in the course to earn your certificate!
          </p>
          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600">Current Progress:</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${enrollment?.progress || 0}%` }} />
            </div>
            <p className="text-sm font-semibold text-blue-600 mt-1">{enrollment?.progress || 0}% Complete</p>
          </div>
          <Link to={`/courses/${id}`} className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition">
            Continue Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link to={`/courses/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition">
            <FiArrowLeft size={14} /> Back to Course
          </Link>
          <button onClick={handleDownload}
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-blue-700 transition text-sm">
            <FiDownload size={15} /> Download Certificate
          </button>
        </div>

        {/* Certificate */}
        <div ref={certRef}
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)",
            padding: "60px",
            borderRadius: "16px",
            position: "relative",
            overflow: "hidden",
            fontFamily: "Georgia, serif",
          }}>

          {/* Decorative circles */}
          <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

          {/* Border frame */}
          <div style={{ border: "3px solid rgba(255,255,255,0.3)", borderRadius: "12px", padding: "40px", position: "relative" }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "14px", color: "#93c5fd", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>
                LearnHub
              </div>
              <div style={{ fontSize: "36px", fontWeight: "bold", color: "white", marginBottom: "4px" }}>
                Certificate of Completion
              </div>
              <div style={{ width: "80px", height: "3px", background: "#fbbf24", margin: "12px auto" }} />
            </div>

            {/* Body */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <p style={{ color: "#bfdbfe", fontSize: "16px", marginBottom: "16px" }}>
                This is to certify that
              </p>
              <div style={{
                fontSize: "42px", fontWeight: "bold", color: "#fbbf24",
                fontStyle: "italic", marginBottom: "16px",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)"
              }}>
                {user?.name}
              </div>
              <p style={{ color: "#bfdbfe", fontSize: "16px", marginBottom: "16px" }}>
                has successfully completed the course
              </p>
              <div style={{
                fontSize: "26px", fontWeight: "bold", color: "white",
                marginBottom: "8px", maxWidth: "500px", margin: "0 auto 16px"
              }}>
                {course?.title}
              </div>
              <p style={{ color: "#93c5fd", fontSize: "14px" }}>
                Instructed by <strong style={{ color: "white" }}>{course?.instructor}</strong>
              </p>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "40px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: "160px", height: "2px", background: "rgba(255,255,255,0.4)", marginBottom: "8px" }} />
                <p style={{ color: "#93c5fd", fontSize: "12px" }}>Date of Completion</p>
                <p style={{ color: "white", fontSize: "14px", fontWeight: "bold" }}>{completionDate}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  border: "3px solid #fbbf24", display: "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 8px",
                  background: "rgba(251,191,36,0.1)"
                }}>
                  <span style={{ fontSize: "32px" }}>🏆</span>
                </div>
                <p style={{ color: "#fbbf24", fontSize: "12px", fontWeight: "bold" }}>CERTIFIED</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: "160px", height: "2px", background: "rgba(255,255,255,0.4)", marginBottom: "8px" }} />
                <p style={{ color: "#93c5fd", fontSize: "12px" }}>LearnHub Platform</p>
                <p style={{ color: "white", fontSize: "14px", fontWeight: "bold" }}>Authorized Signature</p>
              </div>
            </div>

            {/* Certificate ID */}
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <p style={{ color: "#475569", fontSize: "11px" }}>
                Certificate ID: LH-{id?.slice(-8).toUpperCase()}-{user?._id?.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Share message */}
        <div className="bg-white rounded-2xl p-5 mt-6 border border-gray-100 text-center">
          <p className="text-gray-600 text-sm">
            🎉 Congratulations! Share this achievement on{" "}
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=https://learnhub.com`}
              target="_blank" rel="noreferrer"
              className="text-blue-600 font-semibold hover:underline">LinkedIn</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificatePage;