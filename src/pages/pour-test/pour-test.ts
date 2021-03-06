import { Component } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Platform, NavController } from 'ionic-angular';
import { Insomnia } from 'ionic-native';

import { Locale, LocalizationService } from 'angular2localization';

import { Measure } from '../../models/measure.model';
import { PourTest } from '../../models/pour-test.model';
import { PourTestSuite } from '../../models/pour-test-suite.model';
import { FreePouringService } from '../free-pouring/free-pouring.service';

import { StorageService } from '../../services/storage.service';

import { PourTestResultPage } from '../pour-test-result/pour-test-result';
import { MainPage } from '../main/main';

@Component({
  selector: 'pour-test-page',
  templateUrl: 'pour-test.html',
  providers: [FreePouringService, StorageService]
})
export class PourTestPage extends Locale {

  stopPouringSub: Subscription;

  testList: Array<PourTest>;
  currentIndex: number = 0;
  currentTest: PourTest;
  testPhase: string;
  testSuite: PourTestSuite;



  constructor(
      public platform: Platform,
      public navCtrl: NavController,
      public localization: LocalizationService,
      public freePouringService: FreePouringService,
      public storage: StorageService
  ) {
    super(null, localization);


    this.testSuite = new PourTestSuite();
    this.testList = this.testSuite.testList;

    this.freePouringService.toggleAccelerometer();

    this.testPhase = 'TO_BEGIN';


  }

  ngOnInit() {
    this.platform.ready().then(() => {
      Insomnia.keepAwake();
    });
  }

  ngOnDestroy() {
    this.platform.ready().then(() => {
      Insomnia.allowSleepAgain();
    });
  }


  private isLastTest() :boolean {
    return (this.currentIndex === (this.testList.length - 1));
  }

  private goToNextTest() {
    if (!this.isLastTest()) {
      ++this.currentIndex;
      this.currentTest = this.testList[this.currentIndex];
    }
  }

  private gotoResultsPage() :void {
    this.navCtrl.setRoot(MainPage);
    this.navCtrl.push(PourTestResultPage, {
      testSuite: this.testSuite
    });
  }


  startTest() {

    this.testPhase = 'ONGOING';
    this.currentIndex = 0;
    this.currentTest = this.testList[this.currentIndex];

    this.stopPouringSub = this.freePouringService.watchStopPouring().subscribe((stats) => {

      // set the test as done
      this.currentTest.stats = stats;


      if (this.isLastTest()) {
        this.testPhase = 'ENDED';
        this.stopPouringSub.unsubscribe();
        this.currentIndex = 0;
        this.currentTest = null;

        this.storage.addPourTest(this.testSuite);

        this.gotoResultsPage();

      } else {
        this.goToNextTest();
      }


    });


  }
}
