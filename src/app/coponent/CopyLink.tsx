"use client"
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { translate } from './Translate/translate';

const CopyLink = (props) => {
    let text = translate("copied")
  const handleLinkClick = (e, link) => {
    e.preventDefault();
    navigator.clipboard.writeText(link).then(() => {
      toast.success(text);
    }).catch(err => {
      toast.error('error');
      console.error('error', err);
    });
  };

  return (
    <div>
      <a href="https://example.com" onClick={(e) => handleLinkClick(e, 'https://example.com')}>
              { translate("Invite friendss")}
      </a>
      <ToastContainer  autoClose={3000} style={{marginBottom:'56px' ,borderRadius:"15px" }} position={"bottom-right"} />
    </div>
  );
};

export default CopyLink;
