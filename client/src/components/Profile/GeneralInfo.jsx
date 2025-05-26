import React from 'react';
import { formatDate } from '../../utils/helperFunctions';
import Slider from '../MediaPlayers/Slider';
import Image from '../MediaPlayers/Image';
import { useContext } from 'react';
import { ProfileDataContext } from '../contexts/ProfileDataContext';
const GeneralInfo = () => {
  const { isFetching, fetchedUserData } = useContext(ProfileDataContext);
  const searchedUser = fetchedUserData;

  function RenderInfo({ children, text }) {
    return (
      <div className="general-info-block">
        {children}
        <h3 style={{ fontSize: '15px' }}>
          <span></span>
          {text}
        </h3>
      </div>
    );
  }
  return (
    <div className="side-block side-profile-containers">
      <div className="friends-container">
        <div className="friends-container-header">
          <div className="friends-counter">
            <h1 style={{ fontSize: '18px', color: 'white' }}>
              <span style={{ color: 'var(--text-color-glowing)' }}>Meow</span>Ments
            </h1>
            {!isFetching && <h3 style={{ fontSize: '12px' }}>{searchedUser.meowments.length} MeowMents</h3>}
            {isFetching && <div className="skeleton-line"></div>}
          </div>

          <div className="cat-toy-img" style={{ backgroundImage: 'url(/images/cat-toy.png)' }}></div>
        </div>
        <div className="friends-cards-wrapper">
          {!isFetching && searchedUser.meowments?.length === 1 && <Image src={`/LoadMeowment/${searchedUser.userTag}/${searchedUser.meowments[0].fileName}`} key={searchedUser.meowments[0]?.fileName} />}
          {!isFetching && searchedUser.meowments?.length === 0 && <Image src={`/LoadMeowment/${searchedUser.userTag}/default`} />}
          {isFetching && <div className="skeleton-picture" style={{ height: '230px' }}></div>}
          {!isFetching && searchedUser.meowments.length > 0 && searchedUser.meowments.length != 1 && <Slider blobs={searchedUser.meowments} endPoint={`LoadMeowment/${searchedUser.userTag}`} loop={true} key={searchedUser.meowments[0]?.fileName + searchedUser.meowments[1]?.fileName + searchedUser.meowments.length} />}
        </div>
      </div>
      <div className="general-info-section">
        <h1 style={{ fontSize: '18px', color: 'white' }}>General info</h1>

        <div className="general-info-wrapper">
          {!isFetching && (
            <>
              <RenderInfo text={formatDate(searchedUser.generalInfo.dateOfBirth)}>
                <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width={512} height={512}>
                  <path d="M23,22.01H22V17a5,5,0,0,0-3-4.576V12a4.98,4.98,0,0,0-2-3.975L16.161,3.8A1,1,0,0,0,15.18,3h-.36a1,1,0,0,0-.981.8L13.2,7H10.25L11,4a1,1,0,0,0-1-1H8A1,1,0,0,0,7,4l.873,3.493A4.993,4.993,0,0,0,5,12v.424A5,5,0,0,0,2,17v5.01H1a1,1,0,0,0,0,2H23a1,1,0,0,0,0-2ZM10,9h4a3,3,0,0,1,3,3H7A3,3,0,0,1,10,9ZM7,14H17a3,3,0,0,1,3,3v.98c-.936-.1-1.5-.7-1.5-.98a1,1,0,0,0-2,0c0,.344-.682,1-1.75,1C13.661,18,13,17.306,13,17a1,1,0,0,0-2,0c0,.344-.682,1-1.75,1-1.089,0-1.75-.694-1.75-1a1,1,0,0,0-2,0c0,.316-.579.888-1.5.981V17A3,3,0,0,1,7,14ZM4,19.979A4.156,4.156,0,0,0,6.5,19a4.309,4.309,0,0,0,5.5.015A4.309,4.309,0,0,0,17.5,19a4.156,4.156,0,0,0,2.5.978V22.01H4Z" />
                  <circle cx={9} cy={1} r={1} />
                  <circle cx={15} cy={1} r={1} />
                </svg>
              </RenderInfo>
              <RenderInfo text={searchedUser.generalInfo.gender}>
                <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width={512} height={512}>
                  <path d="M22,0H18V2h2.586l-2.4,2.4a6.941,6.941,0,0,0-7.693-.449A6.989,6.989,0,1,0,6,16.92V19H3v2H6v3H8V21h3V19H8V16.927a6.934,6.934,0,0,0,2.491-.88A6.986,6.986,0,0,0,19.6,5.816l2.4-2.4V6h2V2A2,2,0,0,0,22,0ZM2,10A4.971,4.971,0,0,1,8.788,5.344a6.956,6.956,0,0,0,0,9.312A4.971,4.971,0,0,1,2,10Zm12,5a5,5,0,1,1,5-5A5.006,5.006,0,0,1,14,15Z" />
                </svg>
              </RenderInfo>
              <RenderInfo text={searchedUser.generalInfo.livesIn}>
                <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width={512} height={512}>
                  <path d="M12,12A4,4,0,1,0,8,8,4,4,0,0,0,12,12Zm0-6a2,2,0,1,1-2,2A2,2,0,0,1,12,6Zm8.66,3.157-.719-.239A8,8,0,0,0,12,0,7.993,7.993,0,0,0,4.086,9.092a5.045,5.045,0,0,0-2.548,1.3A4.946,4.946,0,0,0,0,14v4.075a5.013,5.013,0,0,0,3.6,4.8l2.87.9A4.981,4.981,0,0,0,7.959,24a5.076,5.076,0,0,0,1.355-.186l5.78-1.71a2.987,2.987,0,0,1,1.573,0l2.387.8A4,4,0,0,0,24,19.021V13.872A5.015,5.015,0,0,0,20.66,9.156ZM7.758,3.762a5.987,5.987,0,0,1,8.484,0,6.037,6.037,0,0,1,.011,8.5L12.7,15.717a.992.992,0,0,1-1.389,0L7.758,12.277A6.04,6.04,0,0,1,7.758,3.762ZM22,19.021a1.991,1.991,0,0,1-.764,1.572,1.969,1.969,0,0,1-1.626.395L17.265,20.2a5.023,5.023,0,0,0-2.717-.016L8.764,21.892a3,3,0,0,1-1.694-.029l-2.894-.9A3.013,3.013,0,0,1,2,18.075V14a2.964,2.964,0,0,1,.92-2.163,3.024,3.024,0,0,1,1.669-.806A8.021,8.021,0,0,0,6.354,13.7l3.567,3.453a2.983,2.983,0,0,0,4.174,0l3.563-3.463a7.962,7.962,0,0,0,1.813-2.821l.537.178A3.006,3.006,0,0,1,22,13.872Z" />
                </svg>
              </RenderInfo>

              <RenderInfo text={searchedUser.generalInfo.email}>
                <svg id="Layer_1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1">
                  <path d="m12 1c-5.122 0-11 1.25-11 11s5.878 11 11 11 11-1.25 11-11-5.878-11-11-11zm0 20c-5.402 0-9-1.53-9-9s3.598-9 9-9 9 1.53 9 9-3.598 9-9 9z" />
                  <path d="m16.704 7.158c-.089-.021-2.207-.531-4.704-.531-2.453 0-4.609.509-4.7.53-.332.08-.601.323-.712.646-.026.075-.636 1.865-.636 4.198s.61 4.123.636 4.198c.112.324.383.568.717.646.092.021 2.288.529 4.695.529 2.492 0 4.615-.51 4.704-.531.33-.08.596-.322.708-.642.026-.075.637-1.852.637-4.2 0-2.368-.612-4.129-.638-4.204-.112-.318-.378-.559-.706-.639zm-4.704 1.469c1.469 0 2.811.2 3.574.341-.354.353-.932.896-1.678 1.471-.673.52-1.423.988-1.896 1.27-.473-.281-1.221-.749-1.896-1.27-.745-.574-1.323-1.117-1.676-1.47.772-.141 2.126-.342 3.573-.342zm3.673 6.389c-.742.141-2.139.358-3.673.358-1.484 0-2.912-.221-3.673-.362-.155-.621-.375-1.725-.375-3.012 0-.249.014-.484.029-.718.27.234.569.484.902.74 1.211.934 2.581 1.686 2.638 1.718.15.082.543.219.96 0 .058-.031 1.427-.784 2.638-1.718.332-.256.632-.506.902-.74.014.233.028.468.028.718 0 1.296-.22 2.399-.375 3.015z" />
                </svg>
              </RenderInfo>

              {/* <div className="general-info-block">
                <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24">
                  <path d="M12,24C5.383,24,0,18.617,0,12S5.383,0,12,0s12,5.383,12,12-5.383,12-12,12Zm0-22C6.486,2,2,6.486,2,12s4.486,10,10,10,10-4.486,10-10S17.514,2,12,2ZM6,15.827l1.378,1.378c.539,.54,1.249,.795,1.957,.795,3.634,0,8.666-4.752,8.666-8.666,0-.708-.256-1.418-.795-1.957l-1.378-1.378-2.712,2.712,1.775,1.775c-.882,2.195-2.376,3.629-4.403,4.403l-1.775-1.775-2.712,2.712Z" />
                </svg>

                <h3>
                  <span>{searchedUser.generalInfo.phoneNumber}</span>
                </h3>
              </div> */}
            </>
          )}

          {isFetching && (
            <>
              <div className="skeleton-line" style={{ height: '15px' }}></div>
              <div className="skeleton-line" style={{ height: '15px' }}></div>
              <div className="skeleton-line" style={{ height: '15px' }}></div>
              <div className="skeleton-line" style={{ height: '15px' }}></div>
              <div className="skeleton-line" style={{ height: '15px' }}></div>
              <div className="skeleton-line" style={{ height: '15px' }}></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralInfo;
